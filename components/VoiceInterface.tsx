import React, { useState, useEffect, useMemo } from 'react';
import type { Chat } from '@google/genai';
import { useVoiceProcessor } from '../hooks/useVoiceProcessor';
import AudioVisualizer from './AudioVisualizer';
import { streamMessageToBot } from '../services/geminiService';

interface VoiceInterfaceProps {
  onExit: () => void;
  chat: Chat | null;
}

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onExit, chat }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const { isListening, transcript, frequencyData, startListening, stopListening, speak, setTranscript } = useVoiceProcessor();

  useEffect(() => {
    // This effect handles the transition when listening stops
    if (!isListening && voiceState === 'listening') {
      stopListening(); // Ensure all resources are released
      if (transcript.trim()) {
        setVoiceState('thinking');
        handleSendMessage(transcript.trim());
      } else {
        setVoiceState('idle'); // No speech detected, return to idle
      }
    }
  }, [isListening, voiceState, transcript]);
  
  const handleSendMessage = async (messageText: string) => {
    if (!chat) {
        setVoiceState('error');
        return;
    };

    try {
      const stream = await streamMessageToBot(chat, messageText);
      let responseBuffer = '';
      
      for await (const chunk of stream) {
        responseBuffer += chunk.text;
      }
      
      const fullResponse = responseBuffer.replace(/\|\|\|/g, ' ').replace(/\*\*/g, '').trim();

      if (fullResponse) {
        setVoiceState('speaking');
        speak(fullResponse, () => {
          setVoiceState('idle');
          setTranscript('');
        });
      } else {
        // Handle cases where the bot returns an empty response
        setVoiceState('speaking');
        speak("Não consegui encontrar uma resposta para isso. Você pode tentar perguntar de outra forma?", () => {
            setVoiceState('idle');
        });
      }
    } catch (error) {
      console.error('Failed to get response from bot:', error);
      setVoiceState('speaking');
      speak('Desculpe, ocorreu um erro de comunicação. Por favor, tente novamente.', () => {
        setVoiceState('idle');
      });
    }
  };

  const handleVisualizerClick = () => {
    if (voiceState === 'idle' || voiceState === 'error') {
      setTranscript('');
      setVoiceState('listening');
      startListening();
    } else if (voiceState === 'listening') {
      stopListening(); // This will trigger the useEffect to process the transcript
    }
    // Clicks are ignored during 'thinking' and 'speaking'
  };

  const statusText = useMemo(() => {
    switch (voiceState) {
      case 'listening': return 'Ouvindo... Toque para parar.';
      case 'thinking': return 'Processando...';
      case 'speaking': return 'Rosa Amiga está respondendo...';
      case 'error': return 'Ocorreu um erro. Toque para tentar novamente.';
      case 'idle':
      default:
        return 'Toque na esfera para começar a falar.';
    }
  }, [voiceState]);

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

        <div className="text-center p-4 h-1/5 flex flex-col justify-center items-center">
            <p className="text-white text-lg font-semibold h-8 mb-2">
                {statusText}
            </p>
            <p className="text-gray-300 min-h-[56px] max-w-prose">
                {transcript}
            </p>
        </div>
    </div>
  );
};

export default VoiceInterface;