'use client';

/**
 * SparkleBurst — انفجار شرر نجوم ذهبيّة
 * للاستخدام عند صرف نقاط ولاء · إصدار بطاقة · لحظات مميّزة
 */
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  trigger: boolean;
  count?: number;
  onDone?: () => void;
  color?: string;
}

export default function SparkleBurst({
  trigger, count = 8, onDone, color = '#e8c88a',
}: Props) {
  const [sparkles, setSparkles] = useState<Array<any>>([]);

  useEffect(() => {
    if (!trigger) return;
    const items = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count;
      const distance = 50 + Math.random() * 30;
      return {
        id: `${Date.now()}-${i}`,
        sx: Math.cos(angle) * distance,
        sy: Math.sin(angle) * distance,
        delay: i * 30,
        size: 10 + Math.random() * 8,
      };
    });
    setSparkles(items);
    const t = setTimeout(() => { setSparkles([]); onDone?.(); }, 1100);
    return () => clearTimeout(t);
  }, [trigger, count, onDone]);

  if (sparkles.length === 0) return null;
  return (
    <>
      {sparkles.map((s) => (
        <Sparkles
          key={s.id}
          className="sparkle"
          style={{
            color,
            width: s.size,
            height: s.size,
            top: '50%',
            left: '50%',
            marginTop: -s.size / 2,
            marginLeft: -s.size / 2,
            animationDelay: `${s.delay}ms`,
            ['--sx' as any]: `${s.sx}px`,
            ['--sy' as any]: `${s.sy}px`,
          }}
        />
      ))}
    </>
  );
}
