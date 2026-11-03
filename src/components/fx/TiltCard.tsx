'use client';

/**
 * TiltCard — غلاف يميل بطاقته 3D مع الماوس
 *
 * - أداء عالي · يستخدم requestAnimationFrame
 * - يحترم prefers-reduced-motion
 * - desktop only (الموبايل ما فيه hover)
 *
 * الاستخدام:
 *   <TiltCard max={10}>
 *     <div className="your card">...</div>
 *   </TiltCard>
 */
import { useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  max?: number;          // أقصى زاوية ميلان (deg)
  perspective?: number;  // perspective للـ3D
  scale?: number;        // scale عند الـhover
  className?: string;
}

export default function TiltCard({
  children, max = 8, perspective = 1000, scale = 1.02, className = '',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  function handleMove(e: React.MouseEvent) {
    if (!ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -max * 2;
    const tiltY = (x - 0.5) * max * 2;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.transform =
        `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    });
  }

  function handleLeave() {
    if (!ref.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    ref.current.style.transform = `perspective(${perspective}px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`tilt-card ${className}`}
    >
      {children}
    </div>
  );
}
