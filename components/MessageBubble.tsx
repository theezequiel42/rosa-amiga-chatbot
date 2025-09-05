import React, { useEffect, useState } from 'react';
import { ChatMessage, Sender } from '../types';
import {
  RiFlowerFill,
  RiHandHeartLine,
  // Fix: The icon RiQuotationRightLine does not exist in react-icons/ri. Replaced with RiDoubleQuotesR.
  RiDoubleQuotesR,
  RiLeafLine,
  RiLightbulbFlashLine
} from 'react-icons/ri';

interface MessageBubbleProps {
  message: ChatMessage;
  isLoading?: boolean;
}

const BotAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0" role="img" aria-label="Avatar da Rosa Amiga">
    <RiFlowerFill className="h-5 w-5 text-white" aria-hidden="true" />
  </div>
);

const ALLOWED_ICONS: Record<string, React.ElementType> = {
  RiHandHeartLine,
  // Fix: The icon RiQuotationRightLine does not exist in react-icons/ri. Replaced with RiDoubleQuotesR.
  RiDoubleQuotesR,
  RiLeafLine,
  RiLightbulbFlashLine
};

const ICON_LABELS: Record<string, string> = {
  RiHandHeartLine: 'Mão com coração',
  RiDoubleQuotesR: 'Aspas duplas',
  RiLeafLine: 'Folha',
  RiLightbulbFlashLine: 'Ideia',
};


const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLoading = false }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger the animation shortly after mounting
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isUser = message.sender === Sender.User;

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const bubbleContainerClasses = isUser
    ? 'flex justify-end'
    : 'flex justify-start items-end space-x-2';

  const bubbleClasses = isUser
    ? 'bg-pink-500 text-white rounded-br-none'
    : 'bg-purple-500 text-white rounded-bl-none';
    
  const animationClasses = show
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-2';

  return (
    <div className={bubbleContainerClasses}>
      {!isUser && <BotAvatar />}
      <div className={`py-3 px-4 rounded-2xl max-w-xs lg:max-w-md shadow-md transition-all duration-300 ease-out ${bubbleClasses} ${animationClasses}`}>
        {isLoading ? (
          <div className="flex items-center justify-center space-x-1.5">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        ) : message.imageUrl ? (
          <div className="flex flex-col items-center">
            <img
              src={message.imageUrl}
              alt={message.alt || 'Ilustração'}
              loading="lazy"
              decoding="async"
              className="rounded-xl max-w-full h-auto"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img.src.endsWith('.webp')) {
                  img.src = img.src.replace(/\.webp($|\?)/, '.png$1');
                }
              }}
            />
            {message.text ? (
              <div className="mt-2 w-full text-sm leading-relaxed">
                {renderText(message.text)}
              </div>
            ) : null}
          </div>
        ) : message.icon && ALLOWED_ICONS[message.icon.name] ? (
          <div className="flex justify-center items-center">
            <span role="img" aria-label={ICON_LABELS[message.icon.name] || 'Ícone'} title={ICON_LABELS[message.icon.name] || 'Ícone'}>
              {React.createElement(ALLOWED_ICONS[message.icon.name], {
                  className: 'h-12 w-12 text-white',
                  'aria-hidden': 'true',
              })}
            </span>
          </div>
        ) : (
          renderText(message.text)
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
