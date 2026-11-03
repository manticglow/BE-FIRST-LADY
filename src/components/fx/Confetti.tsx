'use client';

/**
 * Confetti — انفجار كونفيتي ذهبي + ورديّ
 *
 * الاستخدام:
 *   const [celebrate, setCelebrate] = useState(false);
 *   {celebrate && <Confetti onDone={() => setCelebrate(false)} />}
 *
 * أو · imperative:
 *   import { fireConfetti } from '@/components/fx/Confetti';
 *   fireConfetti();
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  count?: number;
  duration?: number;    // ms
  onDone?: () => void;
}

const COLORS = [
  '#c9a96e', '#d4b062', '#e8c88a', '#f0d4b2',  // gold tones
  '#e8bca8', '#f5c6c6', '#e8a4b4', '#d88a9c',  // rose/pink
  '#ffffff', '#f8f0dc',                           // cream highlights
];

export default function Confetti({
  count = 60, duration = 2600, onDone,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [pieces, setPieces] = useState<Array<any>>([]);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone?.();
      return;
    }

    const newPieces = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 500,
      drift: (Math.random() - 0.5) * 300,
      size: 6 + Math.random() * 10,
      rotation: Math.random() * 360,
    }));
    setPieces(newPieces);

    const t = setTimeout(() => onDone?.(), duration + 500);
    return () => clearTimeout(t);
  }, [count, duration, onDone]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
        overflow: 'hidden',
      }}
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            animationDelay: `${p.delay}ms`,
            ['--drift' as any]: `${p.drift}px`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>,
    document.body,
  );
}

// ─── Imperative API ───
export function fireConfetti(opts?: Partial<Props>) {
  if (typeof window === 'undefined') return;
  const container = document.createElement('div');
  document.body.appendChild(container);

  // Dynamic mount
  import('react-dom/client').then(({ createRoot }) => {
    const root = createRoot(container);
    root.render(
      <Confetti
        {...opts}
        onDone={() => {
          root.unmount();
          container.remove();
          opts?.onDone?.();
        }}
      />
    );
  });
}
