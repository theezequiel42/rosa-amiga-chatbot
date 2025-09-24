import { useState, useRef, useEffect, useCallback } from 'react';

// --- START: Web Speech API Type Declarations ---
// These types are not always included in default TS DOM libraries.
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}
// --- END: Web Speech API Type Declarations ---

// Handle browser prefixes for SpeechRecognition
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

type SpeechStreamHandle = {
  enqueue: (text: string) => void;
  end: () => void;
  cancel: () => void;
};

interface SpeechStreamController {
  token: number;
  queue: string[];
  onEnd?: () => void;
  isSpeaking: boolean;
  ended: boolean;
}

type VoiceErrorCode =
  | 'speech-recognition-unsupported'
  | 'microphone-permission-denied'
  | 'microphone-not-found'
  | 'microphone-unavailable';

const createVoiceError = (code: VoiceErrorCode, message: string) =>
  Object.assign(new Error(message), { code });

const normalizeText = (t: string) =>
  t
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*([,;:.!?])\s*/g, '$1 ')
    .trim();

const splitIntoChunks = (t: string) => {
  const parts = t
    .split(/(?<=[.!?])\s+(?=[^\s])/g)
    .flatMap((p) => p.split(/(?<=;|:)\s+/g));
  const merged: string[] = [];
  for (const part of parts) {
    const segment = part.trim();
    if (!segment) continue;
    if (merged.length && (segment.length < 16 || /^(e|ou|mas|que)\b/i.test(segment))) {
      merged[merged.length - 1] += ' ' + segment;
    } else {
      merged.push(segment);
    }
  }
  return merged;
};

const isNumberHeavy = (value: string) => /\d|%|R\$|\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/.test(value);

const jitter = (min: number, max: number) => min + Math.random() * (max - min);

export const useVoiceProcessor = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(0));
  const [preferredVoice, setPreferredVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const speechStreamRef = useRef<SpeechStreamController | null>(null);

  useEffect(() => {
    const getAndSetVoice = () => {
      const voices = speechSynthesis.getVoices();
      if (!voices.length) {
        return;
      }

      // Prefer Brazilian Portuguese voices
      const ptBrVoices = voices.filter(voice => voice.lang === 'pt-BR');
      const ptGeneric = voices.filter(voice => voice.lang?.startsWith('pt'));
      const candidates = ptBrVoices.length ? ptBrVoices : ptGeneric;
      if (!candidates.length) return;

      // Score voices by naturalness hints and vendor quality
      const scoreVoice = (v: SpeechSynthesisVoice) => {
        let s = 0;
        const name = v.name || '';
        if (v.localService === false) s += 5; // cloud voices tend to be neural
        if (/(Natural|Neural|Online|Cloud)/i.test(name)) s += 4;
        if (/(Microsoft|Google|Amazon|Apple|Siri)/i.test(name)) s += 3;
        if (/(Brazil|Brasil|BR)/i.test(name)) s += 1;
        if (/(Compact|Legacy)/i.test(name)) s -= 2;
        // Prefer some common, good-sounding pt-BR names
        if (/(maria|ana|camila|luciana|helena|isabela|manuela|clara|sofia|laura|helo[ií]sa)/i.test(name)) s += 2;
        return s;
      };

      const best = [...candidates].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
      setPreferredVoice(best);
    };

    getAndSetVoice(); // Initial attempt in case voices are already loaded
    speechSynthesis.addEventListener('voiceschanged', getAndSetVoice);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', getAndSetVoice);
    };
  }, []);


  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    setFrequencyData(new Uint8Array(0));
  }, []);

  const processAudio = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      setFrequencyData(Uint8Array.from(dataArrayRef.current));
      animationFrameRef.current = requestAnimationFrame(processAudio);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;

    setTranscript('');
    setFinalTranscript('');

    if (!SpeechRecognitionAPI) {
      throw createVoiceError('speech-recognition-unsupported', 'Speech recognition is not supported in this browser.');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw createVoiceError('microphone-unavailable', 'Audio capture is not available in this environment.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;

      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      processAudio();

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'pt-BR';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setFinalTranscript(prev => {
          const updatedFinal = prev + final;
          setTranscript(updatedFinal + interim);
          return updatedFinal;
        });
      };

      recognition.onend = () => {
        setIsListening(false);
        cleanup();
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setIsListening(false);
      cleanup();
      let code: VoiceErrorCode = 'microphone-unavailable';
      const name = (err as { name?: string } | undefined)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        code = 'microphone-permission-denied';
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
        code = 'microphone-not-found';
      } else if (name === 'NotReadableError' || name === 'AbortError' || name === 'InvalidStateError') {
        code = 'microphone-unavailable';
      }
      const message = err instanceof Error ? err.message : 'Failed to access microphone.';
      throw createVoiceError(code, message);
    }
  }, [isListening, processAudio, cleanup, finalTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
        cleanup();
        speechSynthesis.cancel();
    };
  }, [cleanup]);

  const speakTokenRef = useRef(0);

  const createSpeechStream = useCallback((onEnd?: () => void): SpeechStreamHandle => {
    speechSynthesis.cancel();
    const token = ++speakTokenRef.current;
    const controller: SpeechStreamController = {
      token,
      queue: [],
      onEnd,
      isSpeaking: false,
      ended: false,
    };
    speechStreamRef.current = controller;

    const baseRate = 1.0;
    const basePitch = 1.0;

    const playNext = () => {
      const active = speechStreamRef.current;
      if (!active || active.token !== token) {
        return;
      }

      if (!active.queue.length) {
        active.isSpeaking = false;
        if (active.ended) {
          speechStreamRef.current = null;
          active.onEnd?.();
        }
        return;
      }

      active.isSpeaking = true;
      const chunk = active.queue.shift()!;
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = 'pt-BR';
      const numberHeavy = isNumberHeavy(chunk);
      const rateAdj = numberHeavy ? 0.92 : jitter(0.97, 1.05);
      const pitchAdj = jitter(0.96, 1.04);
      utterance.rate = Math.max(0.8, Math.min(1.3, baseRate * rateAdj));
      utterance.pitch = Math.max(0.8, Math.min(1.2, basePitch * pitchAdj));
      utterance.volume = 1.0;

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onerror = (e) => {
        console.error('SpeechSynthesis Error', e);
        active.isSpeaking = false;
        setTimeout(playNext, 0);
      };
      utterance.onend = () => {
        if (!speechStreamRef.current || speechStreamRef.current.token !== token) {
          return;
        }
        active.isSpeaking = false;
        const gap = numberHeavy ? 140 : 90;
        setTimeout(playNext, gap);
      };

      speechSynthesis.speak(utterance);
    };

    return {
      enqueue: (text: string) => {
        if (!text || !text.trim()) {
          return;
        }
        const normalized = normalizeText(text);
        if (!normalized) {
          return;
        }
        const parts = splitIntoChunks(normalized);
        if (!parts.length) {
          return;
        }
        controller.queue.push(...parts);
        if (!controller.isSpeaking) {
          playNext();
        }
      },
      end: () => {
        controller.ended = true;
        if (!controller.isSpeaking && controller.queue.length === 0) {
          if (speechStreamRef.current && speechStreamRef.current.token === token) {
            speechStreamRef.current = null;
            controller.onEnd?.();
          }
        }
      },
      cancel: () => {
        if (speechStreamRef.current && speechStreamRef.current.token === token) {
          speechSynthesis.cancel();
          speechStreamRef.current = null;
        }
      },
    };
  }, [preferredVoice]);

  const speak = useCallback((text: string, onEnd: () => void) => {
    const stream = createSpeechStream(onEnd);
    stream.enqueue(text);
    stream.end();
  }, [createSpeechStream]);

  return { isListening, transcript, frequencyData, startListening, stopListening, speak, setTranscript, createSpeechStream };
};
