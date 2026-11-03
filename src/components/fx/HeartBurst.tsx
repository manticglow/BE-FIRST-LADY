'use client';

/**
 * HeartBurst — انفجار قلوب تطير لأعلى
 * الاستخدام: ضعيه داخل container نسبي (relative) وشغّليه عند الضغط
 */
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface Props {
  trigger: boolean;
  count?: number;
  onDone?: () => void;
}

export default function HeartBurst({ trigger, count = 5, onDone }: Props) {
  const [hearts, setHearts] = useState<Array<any>>([]);

  useEffect(() => {
    if (!trigger) return;
    const newHearts = Array.from({ length: count }).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      hx: (Math.random() - 0.5) * 80,
      hy: -60 - Math.random() * 60,
      delay: i * 60,
      size: 14 + Math.random() * 12,
      color: ['#e8a4b4', '#f5c6c6', '#d88a9c', '#e8c88a'][i % 4],
    }));
    setHearts(newHearts);
    const t = setTimeout(() => { setHearts([]); onDone?.(); }, 1300);
    return () => clearTimeout(t);
  }, [trigger, count, onDone]);

  if (hearts.length === 0) return null;
  return (
    <>
      {hearts.map((h) => (
        <Heart
          key={h.id}
          className="heart-float"
          fill={h.color}
          style={{
            color: h.color,
            width: h.size,
            height: h.size,
            top: 0,
            left: '50%',
            animationDelay: `${h.delay}ms`,
            '--hx': `${h.hx}px`,
            '--hy': `${h.hy}px`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
