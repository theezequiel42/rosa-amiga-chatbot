import React, { useRef, useEffect } from 'react';
import type { VoiceState } from './VoiceInterface';

export const STATE_COLORS: Record<VoiceState, string> = {
  idle: '#4C1B99',
  listening: '#3450E5',
  thinking: '#CC3399',
  speaking: '#FF4D88',
  error: '#4C1B99',
};

const hexToRgb = (hex: string): [number, number, number] => {
  let normalized = hex.trim().replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(char => char + char).join('');
  }
  const value = parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const mixColor = (base: string, target: string, amount: number) => {
  const [r1, g1, b1] = hexToRgb(base);
  const [r2, g2, b2] = hexToRgb(target);
  const ratio = Math.min(1, Math.max(0, amount));
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
};

export const computeFrequencyValue = (state: VoiceState, data: Uint8Array, timeSeconds: number) => {
  if (state === 'listening' && data.length > 0) {
    const total = data.reduce((sum, value) => sum + value, 0);
    return total / data.length / 128;
  }

  if (state === 'speaking') {
    const slowPulse = (Math.sin(timeSeconds * 4) * 0.5 + 0.5) * 0.6;
    const fastJitter = (Math.sin(timeSeconds * 18) * 0.5 + 0.5) * 0.4;
    return ((slowPulse + fastJitter) / 2) * 0.4;
  }

  return 0;
};

interface LowSpecVisualizerProps {
  frequencyData: Uint8Array;
  interactionState: VoiceState;
  onClick: () => void;
}

const LowSpecVisualizer: React.FC<LowSpecVisualizerProps> = ({ frequencyData, interactionState, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestPropsRef = useRef({ frequencyData, interactionState });

  useEffect(() => {
    latestPropsRef.current = { frequencyData, interactionState };
  }, [frequencyData, interactionState]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width || container.clientWidth;
      const height = rect.height || container.clientHeight;
      if (width > 0 && height > 0) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    resizeCanvas();

    let animationFrameId: number;

    const render = (time: number) => {
      const timeSeconds = time * 0.001;
      const { frequencyData: currentFrequencyData, interactionState: currentState } = latestPropsRef.current;
      const baseColor = STATE_COLORS[currentState] ?? STATE_COLORS.idle;
      const frequencyValue = computeFrequencyValue(currentState, currentFrequencyData, timeSeconds);
      const width = canvas.width;
      const height = canvas.height;

      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      context.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.35;
      const pulse = currentState === 'thinking'
        ? (Math.sin(timeSeconds * 3) * 0.5 + 0.5) * 0.18
        : currentState === 'speaking'
          ? (Math.sin(timeSeconds * 2) * 0.5 + 0.5) * 0.25
          : 0;
      const radius = baseRadius * (1 + Math.min(0.45, frequencyValue * 0.65 + pulse));

      const gradient = context.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
      gradient.addColorStop(0, mixColor(baseColor, '#FFFFFF', 0.55));
      gradient.addColorStop(0.65, mixColor(baseColor, '#FFFFFF', 0.1));
      gradient.addColorStop(1, mixColor(baseColor, '#000000', 0.45));

      context.globalAlpha = 0.9;
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();

      context.globalAlpha = 0.25 + frequencyValue * 0.25;
      context.lineWidth = Math.max(3, radius * 0.1);
      context.strokeStyle = mixColor(baseColor, '#FFFFFF', 0.7);
      context.beginPath();
      context.arc(centerX, centerY, radius * 1.1, 0, Math.PI * 2);
      context.stroke();

      context.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => resizeCanvas())
      : null;

    observer?.observe(container);

    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className="w-full h-full cursor-pointer relative"
      aria-label="Visualizador de audio interativo"
      role="button"
      tabIndex={0}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};

export default LowSpecVisualizer;
