import React from 'react';

interface EmojiProps {
  symbol: string; // e.g. "💜"
  label?: string; // e.g. "coração roxo"
  className?: string;
}

const Emoji: React.FC<EmojiProps> = ({ symbol, label, className }) => {
  // If label provided, expose to screen readers; else hide as decorative
  const ariaProps = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true };

  return (
    <span {...ariaProps} className={className}>
      {symbol}
    </span>
  );
};

export default Emoji;

