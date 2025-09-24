import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { useVoiceProcessor } from '../hooks/useVoiceProcessor';
import AudioVisualizer from './AudioVisualizer';
import { streamMessageToBot } from '../services/geminiService';

interface VoiceInterfaceProps {
  onExit: () => void;
  chat: Chat | null;
}

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

const sanitizeResponseChunk = (raw: string) =>
  raw
    .replace(/\|\|\|/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const resolveStartErrorMessage = (error: unknown) => {
  const fallback = 'Não consegui acessar o microfone. Verifique as permissões ou volte para o bate-papo de texto.';
  if (error && typeof error === 'object') {
    const code = (error as { code?: string }).code;
    switch (code) {
      case 'speech-recognition-unsupported':
        return 'Seu navegador não oferece suporte ao reconhecimento de voz. Volte para o bate-papo de texto.';
      case 'microphone-permission-denied':
        return 'Preciso da permissão do microfone para conversar por voz. Conceda acesso ou use o bate-papo de texto.';
      case 'microphone-not-found':
        return 'Não encontrei um microfone conectado. Conecte um dispositivo ou volte para o bate-papo de texto.';
      case 'microphone-unavailable':
        return 'O microfone está ocupado em outro aplicativo. Feche o outro app ou volte para o bate-papo de texto.';
      default:
        break;
    }
  }
  return fallback;
};

const resolveStreamingErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const code = (error as { code?: string; status?: string }).code ?? (error as { code?: string; status?: string }).status;
    if (code && /deadline|timeout/i.test(code)) {
      return 'A resposta demorou mais do que o esperado. Volte para o bate-papo de texto ou tente novamente.';
    }
  }
  if (error instanceof Error && /timeout|deadline/i.test(error.message)) {
    return 'A resposta demorou mais do que o esperado. Volte para o bate-papo de texto ou tente novamente.';
  }
  return 'Perdi a conexão com o assistente. Volte para o bate-papo de texto ou tente novamente em instantes.';
};

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onExit, chat }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { isListening, transcript, frequencyData, startListening, stopListening, setTranscript, createSpeechStream } = useVoiceProcessor();
  const activeSpeechStreamRef = useRef<ReturnType<typeof createSpeechStream> | null>(null);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!chat) {
      setVoiceState('error');
      setErrorMessage('Não foi possível iniciar a conversa agora. Volte para o bate-papo de texto.');
      return;
    }

    setErrorMessage('');
    activeSpeechStreamRef.current?.cancel();
    activeSpeechStreamRef.current = null;

    let speechHandle: ReturnType<typeof createSpeechStream> | null = null;

    try {
      const stream = await streamMessageToBot(chat, messageText);
      speechHandle = createSpeechStream(() => {
        activeSpeechStreamRef.current = null;
        setVoiceState('idle');
        setTranscript('');
      });
      activeSpeechStreamRef.current = speechHandle;

      let receivedResponse = false;

      for await (const chunk of stream) {
        const portion = sanitizeResponseChunk(chunk.text ?? '');
        if (!portion) {
          continue;
        }
        if (!receivedResponse) {
          setVoiceState('speaking');
          receivedResponse = true;
        }
        speechHandle.enqueue(portion);
      }

      if (receivedResponse) {
        speechHandle.end();
      } else {
        speechHandle.cancel();
        activeSpeechStreamRef.current = null;
        setVoiceState('error');
        setErrorMessage('Não consegui encontrar uma resposta agora. Volte para o bate-papo de texto.');
      }
    } catch (error) {
      console.error('Failed to get response from bot:', error);
      speechHandle?.cancel();
      activeSpeechStreamRef.current = null;
      setVoiceState('error');
      setErrorMessage(resolveStreamingErrorMessage(error));
    }
  }, [chat, createSpeechStream, setTranscript]);

  useEffect(() => {
    if (!isListening && voiceState === 'listening') {
      stopListening();
      if (transcript.trim()) {
        setErrorMessage('');
        setVoiceState('thinking');
        handleSendMessage(transcript.trim());
      } else {
        setVoiceState('idle');
      }
    }
  }, [isListening, voiceState, transcript, stopListening, handleSendMessage]);

  const handleVisualizerClick = async () => {
    if (voiceState === 'idle' || voiceState === 'error') {
      activeSpeechStreamRef.current?.cancel();
      activeSpeechStreamRef.current = null;
      setTranscript('');
      setErrorMessage('');
      setVoiceState('listening');
      try {
        await startListening();
      } catch (error) {
        console.error('Failed to start listening:', error);
        setVoiceState('error');
        setErrorMessage(resolveStartErrorMessage(error));
      }
    } else if (voiceState === 'listening') {
      stopListening();
    }
  };

  useEffect(() => () => {
    activeSpeechStreamRef.current?.cancel();
    activeSpeechStreamRef.current = null;
  }, []);

  const statusText = useMemo(() => {
    switch (voiceState) {
      case 'listening':
        return 'Ouvindo... toque para parar.';
      case 'thinking':
        return 'Processando a sua pergunta...';
      case 'speaking':
        return 'Rosa Amiga está respondendo...';
      case 'error':
        return 'Algo deu errado com o modo de voz.';
      case 'idle':
      default:
        return 'Toque na esfera para começar a falar.';
    }
  }, [voiceState]);

  const secondaryText = voiceState === 'error' ? (errorMessage || 'Volte para o bate-papo de texto ou toque para tentar novamente.') : transcript;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm absolute inset-0 animate-fade-in-up animation-delay-0">
      <button
        onClick={onExit}
        className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Voltar para o bate-papo de texto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="w-full h-3/5 max-w-3xl">
        <AudioVisualizer
          frequencyData={frequencyData}
          interactionState={voiceState}
          onClick={handleVisualizerClick}
        />
      </div>

      <div className="text-center p-4 h-1/5 flex flex-col justify-center items-center space-y-3">
        <p className="text-white text-lg font-semibold min-h-[32px]">
          {statusText}
        </p>
        <p className="text-gray-300 min-h-[56px] max-w-prose">
          {secondaryText}
        </p>
        {voiceState === 'error' && (
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          >
            Voltar para o bate-papo de texto
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface;
