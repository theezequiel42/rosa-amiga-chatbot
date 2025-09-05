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
      setFrequencyData(new Uint8Array(dataArrayRef.current));
      animationFrameRef.current = requestAnimationFrame(processAudio);
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;

    setTranscript('');
    setFinalTranscript('');
    
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

      if (SpeechRecognitionAPI) {
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
          setFinalTranscript(prev => prev + final);
          setTranscript(finalTranscript + final + interim);
        };
        
        recognition.onend = () => {
            setIsListening(false);
            cleanup();
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } else {
        console.error("Speech Recognition not supported in this browser.");
        // Consider setting an error state here
      }
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // Handle permission denied or other errors
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

  const speak = useCallback((text: string, onEnd: () => void) => {
    // Cancel any previous speech and advance token to invalidate pending chunks
    speechSynthesis.cancel();
    const token = ++speakTokenRef.current;

    // Normalize and chunk text to add natural pauses and allow subtle prosody tweaks
    const normalizeText = (t: string) =>
      t
        .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '•') // bullets to dot
        .replace(/[\r\n]+/g, ' ') // collapse newlines
        .replace(/\s{2,}/g, ' ') // extra spaces
        .replace(/\s*([,;:.!?])\s*/g, '$1 ') // tidy spaces around punctuation
        .trim();

    const splitIntoChunks = (t: string) => {
      const parts = t
        .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÚÃÕÂÊÎÔÛÁÉÍÓÚÇ0-9“"']|•)/g) // sentence-ish
        .flatMap(p => p.split(/(?<=;|:)\s+/g)); // split on strong pauses
      // Merge tiny fragments into neighbors
      const merged: string[] = [];
      for (const p of parts) {
        const x = p.trim();
        if (!x) continue;
        if (merged.length && (x.length < 16 || /^(e|ou|mas|que)\b/i.test(x))) {
          merged[merged.length - 1] += ' ' + x;
        } else {
          merged.push(x);
        }
      }
      return merged;
    };

    const isNumberHeavy = (s: string) => /\d|%|R\$|\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/.test(s);

    const chunks = splitIntoChunks(normalizeText(text));
    if (!chunks.length) {
      onEnd();
      return undefined;
    }

    const baseRate = 1.0; // slightly slower than before for naturalness
    const basePitch = 1.0;

    let firstUtterance: SpeechSynthesisUtterance | undefined;

    const speakChunk = (idx: number) => {
      if (token !== speakTokenRef.current) return; // superseded
      if (idx >= chunks.length) {
        onEnd();
        return;
      }

      const chunk = chunks[idx];
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = 'pt-BR';

      // Subtle variation per chunk to reduce monotony
      const jitter = (min: number, max: number) => min + Math.random() * (max - min);
      const rateAdj = isNumberHeavy(chunk) ? 0.92 : jitter(0.97, 1.05);
      const pitchAdj = jitter(0.96, 1.04);
      u.rate = Math.max(0.8, Math.min(1.3, baseRate * rateAdj));
      u.pitch = Math.max(0.8, Math.min(1.2, basePitch * pitchAdj));
      u.volume = 1.0;

      if (preferredVoice) {
        u.voice = preferredVoice;
      }

      u.onerror = (e) => {
        console.error('SpeechSynthesis Error', e);
        // Try to continue with next chunk instead of aborting the whole speak
        setTimeout(() => speakChunk(idx + 1), 0);
      };
      u.onend = () => {
        if (token !== speakTokenRef.current) return;
        // Brief pause between chunks to simulate breath
        const gap = isNumberHeavy(chunk) ? 140 : 90;
        setTimeout(() => speakChunk(idx + 1), gap);
      };

      if (!firstUtterance) firstUtterance = u;
      speechSynthesis.speak(u);
    };

    speakChunk(0);
    return firstUtterance;
  }, [preferredVoice]);

  return { isListening, transcript, frequencyData, startListening, stopListening, speak, setTranscript };
};
