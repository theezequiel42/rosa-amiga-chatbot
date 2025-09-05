import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { ChatMessage, Sender } from '../types';
import { createChatSession, streamMessageToBot } from '../services/geminiService';
import { initializeRag } from '../services/ragService';
import MessageBubble from './MessageBubble';
import VoiceInterface from './VoiceInterface';
import { RiFlowerFill } from 'react-icons/ri';

const QUICK_REPLIES = [
  'O que é violência doméstica?',
  'Contatos',
  'Endereços',
  'Quero apenas conversar.'
];

// Sticker metadata: src + accessible alt
const STICKERS: Record<string, { src: string; alt: string }> = {
  fisica: { src: '/stickers/fisica.webp', alt: 'Ilustração sobre violência física' },
  psicologica: { src: '/stickers/psicologica.webp', alt: 'Ilustração sobre violência psicológica' },
  sexual: { src: '/stickers/sexual.webp', alt: 'Ilustração sobre violência sexual' },
  patrimonial: { src: '/stickers/patrimonial.webp', alt: 'Ilustração sobre violência patrimonial' },
  moral: { src: '/stickers/moral.webp', alt: 'Ilustração sobre violência moral' },
};


const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const welcomeTimeoutsRef = useRef<number[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = useCallback(() => {
    const newChat = createChatSession();
    setChat(newChat);
    setMessages([]);

    const welcomeTexts = [
      'Olá! Eu sou a Rosa Amiga.',
      'Estou aqui para conversar e te ajudar a entender mais sobre relacionamentos e violência doméstica.',
      'Como posso te ajudar hoje?'
    ];

    let cumulativeDelay = 0;
    welcomeTexts.forEach((text, index) => {
      cumulativeDelay += 600;
      const id = window.setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: `bot-welcome-${Date.now()}-${index}`,
          text,
          sender: Sender.Bot,
        };
        setMessages((prev) => [...prev, welcomeMessage]);
      }, cumulativeDelay);
      welcomeTimeoutsRef.current.push(id);
    });
    
    const qrId = window.setTimeout(() => {
      setShowQuickReplies(true);
    }, cumulativeDelay + 500);
    welcomeTimeoutsRef.current.push(qrId);

  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        await initializeRag();
        if (!cancelled) initializeChat();
      } catch (error) {
        console.error("Initialization failed:", error);
        setInitError('Não foi possível iniciar o assistente. Verifique sua conexão e tente recarregar a página.');
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    };
    init();
    return () => {
      cancelled = true;
      // Clear any scheduled welcome message timeouts to avoid duplicates (React StrictMode)
      welcomeTimeoutsRef.current.forEach((id) => clearTimeout(id));
      welcomeTimeoutsRef.current = [];
    };
  }, [initializeChat]);
  
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading || !chat) return;

    setShowQuickReplies(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      sender: Sender.User,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const processMessageText = (text: string) => {
      const raw = text ?? '';
      if (!raw.trim()) return;

      // Parse the chunk sequentially: emit text and visuals in order
      const pattern = /\[\[(img|icon):([a-zA-Z0-9_-]+)\]\]/g;
      let idx = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(raw)) !== null) {
        const [full, kind, value] = match;
        const before = raw.slice(idx, match.index).trim();
        if (before) {
          setMessages((prev) => [
            ...prev,
            { id: `bot-${Date.now()}-${Math.random()}`, text: before, sender: Sender.Bot },
          ]);
        }

        if (kind === 'img') {
          const key = value.toLowerCase();
          const meta = STICKERS[key];
          if (meta) {
            setMessages((prev) => [
              ...prev,
              { id: `bot-${Date.now()}-${Math.random()}`, text: '', imageUrl: meta.src, alt: meta.alt, sender: Sender.Bot },
            ]);
          }
        } else if (kind === 'icon') {
          setMessages((prev) => [
            ...prev,
            { id: `bot-${Date.now()}-${Math.random()}`, text: '', icon: { name: value }, sender: Sender.Bot },
          ]);
        }

        idx = match.index + full.length;
      }

      const tail = raw.slice(idx).trim();
      if (tail) {
        setMessages((prev) => [
          ...prev,
          { id: `bot-${Date.now()}-${Math.random()}`, text: tail, sender: Sender.Bot },
        ]);
      }
    };


    try {
      const stream = await streamMessageToBot(chat, messageText);
      let responseBuffer = '';
      
      for await (const chunk of stream) {
        const delta = chunk.text;
        if (!delta) continue;
        responseBuffer += delta;
        const potentialMessages = responseBuffer.split('|||');

        if (potentialMessages.length > 1) {
          const completeMessages = potentialMessages.slice(0, -1);
          responseBuffer = potentialMessages.slice(-1)[0]; 

          completeMessages.forEach(processMessageText);
        }
      }

      // After the stream is done, process any remaining text in the buffer
      if (responseBuffer.trim()) {
        processMessageText(responseBuffer);
      }

    } catch (error) {
      console.error('Failed to get response from bot:', error);
      const errorMessage: ChatMessage = {
        id: `bot-error-${Date.now()}`,
        text: 'Desculpe, ocorreu um erro de comunicação. Por favor, tente novamente.',
        sender: Sender.Bot,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  }
  
  if (mode === 'voice') {
    return <VoiceInterface onExit={() => setMode('text')} chat={chat} />;
  }

  if (isInitializing || initError) {
    return (
      <div className="flex flex-col flex-grow h-0 items-center justify-center text-center p-4">
        <div className="w-12 h-12 mb-4 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
          <RiFlowerFill size={24} color="white" />
        </div>
        <p className="font-semibold text-lg text-gray-700">
          {initError ? 'Ocorreu um Erro' : 'Preparando assistente...'}
        </p>
        <p className="text-gray-500 mt-1">
          {initError || 'Isso pode levar alguns segundos. Por favor, aguarde.'}
        </p>
      </div>
    );
  }

  const isVoiceSupported = typeof window !== 'undefined' && (
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window &&
    (window as any).AudioContext
  );

  return (
    <div className="flex flex-col flex-grow h-0">
      <div className="flex-grow p-6 overflow-y-auto bg-gray-50">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.sender === Sender.User && (
            <MessageBubble 
              message={{id: 'loading', sender: Sender.Bot, text: ''}} 
              isLoading={true} 
            />
          )}
          {showQuickReplies && (
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2 animate-fade-in-up">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSendMessage(reply)}
                  className="bg-white border border-pink-500 text-pink-600 font-semibold py-2 px-4 rounded-full hover:bg-pink-50 transition-colors text-sm"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleFormSubmit} className="flex items-center space-x-3">
          <label htmlFor="chat-input" className="sr-only">
            Digite sua mensagem
          </label>
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading || showQuickReplies}
            className="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 transition-shadow disabled:bg-gray-100"
            autoComplete="off"
          />
          {isVoiceSupported && (
            <button
              type="button"
              onClick={() => setMode('voice')}
              disabled={isLoading}
              className="text-gray-500 font-semibold w-12 h-12 rounded-full hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 flex items-center justify-center flex-shrink-0"
              aria-label="Ativar bate-papo por voz"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm-1 4a1 1 0 00-1 1v2a1 1 0 102 0v-2a1 1 0 00-1-1zm10-1a1 1 0 100 2v-2a1 1 0 100-2zM9 4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                <path d="M3 10a5 5 0 015-5h4a5 5 0 015 5v2a5 5 0 01-5 5H8a5 5 0 01-5-5v-2zM8 9a3 3 0 00-3 3v2a3 3 0 003 3h4a3 3 0 003-3v-2a3 3 0 00-3-3H8z" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !input.trim() || showQuickReplies}
            className="bg-pink-600 text-white font-semibold w-12 h-12 rounded-full hover:bg-pink-700 disabled:bg-pink-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 flex items-center justify-center flex-shrink-0"
            aria-label="Enviar mensagem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;

