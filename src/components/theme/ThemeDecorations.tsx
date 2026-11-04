/**
 * ThemeDecorations — زخارف ديناميكيّة حسب الثيم
 * ═══════════════════════════════════════════════════════════
 * - palms-swords: شعار السعوديّة (نخلتين وسيفين)
 * - lanterns: فوانيس رمضان
 * - hearts: قلوب متساقطة
 * - stars-crescent: نجوم وهلال
 * - palms-stars: نخيل ونجوم
 * - snowflakes: ثلج
 * - confetti: قصاصات ملوّنة
 */
'use client';

import { useMemo } from 'react';

export default function ThemeDecorations({ type }: { type: string }) {
  switch (type) {
    case 'palms-swords':   return <SaudiNationalDay />;
    case 'lanterns':       return <Lanterns />;
    case 'hearts':         return <Hearts />;
    case 'stars-crescent': return <StarsCrescent />;
    case 'palms-stars':    return <PalmsStars />;
    case 'confetti':       return <Confetti />;
    case 'snowflakes':     return <Snowflakes />;
    default:               return null;
  }
}

// ═══════════════════════════════════════════════════════════
// 🇸🇦 اليوم الوطني السعودي
// ═══════════════════════════════════════════════════════════
function SaudiNationalDay() {
  return (
    <>
      {/* شريط علوي بألوان العلم */}
      <div className="fixed top-0 inset-x-0 z-[70] h-1 flex pointer-events-none">
        <div className="flex-1 bg-[#006C35]" />
      </div>

      {/* زخرفة في الزاويتين · نخلة وسيفين */}
      <div className="fixed bottom-24 md:bottom-8 right-4 z-[60] pointer-events-none opacity-15 md:opacity-25 animate-gentle-float">
        <SaudiEmblem />
      </div>
      <div className="fixed top-24 left-4 z-[60] pointer-events-none opacity-15 md:opacity-25 animate-gentle-float" style={{ animationDelay: '1.5s' }}>
        <SaudiEmblem />
      </div>

      {/* أعلام متحرّكة في الخلفيّة */}
      <FloatingFlags />

      <style>{`
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        .animate-gentle-float { animation: gentle-float 4s ease-in-out infinite; }
      `}</style>
    </>
  );
}

function SaudiEmblem() {
  return (
    <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* نخلة مبسّطة */}
      <g fill="#006C35">
        <ellipse cx="50" cy="35" rx="20" ry="8" transform="rotate(-20 50 35)" />
        <ellipse cx="50" cy="35" rx="20" ry="8" transform="rotate(20 50 35)" />
        <ellipse cx="50" cy="35" rx="18" ry="7" transform="rotate(-50 50 35)" />
        <ellipse cx="50" cy="35" rx="18" ry="7" transform="rotate(50 50 35)" />
        <ellipse cx="50" cy="32" rx="16" ry="6" transform="rotate(-80 50 32)" />
        <ellipse cx="50" cy="32" rx="16" ry="6" transform="rotate(80 50 32)" />
        <rect x="47" y="35" width="6" height="30" />
      </g>
      {/* سيفين متقاطعين */}
      <g stroke="#006C35" strokeWidth="3" strokeLinecap="round">
        <line x1="20" y1="85" x2="80" y2="65" />
        <line x1="80" y1="85" x2="20" y2="65" />
        <circle cx="20" cy="85" r="3" fill="#006C35" />
        <circle cx="80" cy="85" r="3" fill="#006C35" />
        <circle cx="80" cy="65" r="3" fill="#006C35" />
        <circle cx="20" cy="65" r="3" fill="#006C35" />
      </g>
    </svg>
  );
}

function FloatingFlags() {
  const flags = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    id: i,
    left: Math.random() * 90 + 5,
    delay: Math.random() * 5,
    duration: 12 + Math.random() * 8,
  })), []);

  return (
    <>
      <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden" aria-hidden="true">
        {flags.map((f) => (
          <div
            key={f.id}
            className="absolute text-3xl opacity-30 animate-flag-rise"
            style={{
              left: `${f.left}%`,
              bottom: '-50px',
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.duration}s`,
            }}
          >
            🇸🇦
          </div>
        ))}
      </div>
      <style>{`
        @keyframes flag-rise {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-110vh) rotate(-15deg); opacity: 0; }
        }
        .animate-flag-rise { animation: flag-rise linear infinite; }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 🌙 فوانيس رمضان
// ═══════════════════════════════════════════════════════════
function Lanterns() {
  const items = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
    id: i,
    left: 10 + i * 25,
    swing: 3 + Math.random() * 2,
  })), []);
  return (
    <>
      <div className="fixed top-0 inset-x-0 z-[55] pointer-events-none" aria-hidden="true">
        {items.map((lo) => (
          <div
            key={lo.id}
            className="absolute animate-swing"
            style={{ left: `${lo.left}%`, top: 0, animationDuration: `${lo.swing}s` }}
          >
            <svg width="30" height="60" viewBox="0 0 30 60">
              <line x1="15" y1="0" x2="15" y2="10" stroke="#D4AF37" strokeWidth="1" />
              <ellipse cx="15" cy="25" rx="10" ry="12" fill="#D4AF37" opacity="0.8" />
              <rect x="10" y="37" width="10" height="5" fill="#B8860B" />
              <circle cx="15" cy="25" r="3" fill="#FFF8DC" opacity="0.9" />
            </svg>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(-5deg); transform-origin: top; }
          50% { transform: rotate(5deg); transform-origin: top; }
        }
        .animate-swing { animation: swing ease-in-out infinite; }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 💕 قلوب
// ═══════════════════════════════════════════════════════════
function Hearts() {
  const hearts = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 8 + Math.random() * 4,
    size: 14 + Math.random() * 12,
  })), []);
  return (
    <>
      <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden" aria-hidden="true">
        {hearts.map((h) => (
          <div
            key={h.id}
            className="absolute animate-heart-rise"
            style={{
              left: `${h.left}%`,
              bottom: '-30px',
              fontSize: `${h.size}px`,
              animationDelay: `${h.delay}s`,
              animationDuration: `${h.duration}s`,
            }}
          >
            💕
          </div>
        ))}
      </div>
      <style>{`
        @keyframes heart-rise {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 0.6; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-110vh) rotate(20deg); opacity: 0; }
        }
        .animate-heart-rise { animation: heart-rise linear infinite; }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// ⭐ نجوم وهلال
// ═══════════════════════════════════════════════════════════
function StarsCrescent() {
  const stars = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i, left: Math.random() * 100, top: Math.random() * 80, delay: Math.random() * 3,
  })), []);
  return (
    <>
      <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden" aria-hidden="true">
        {stars.map((s) => (
          <div
            key={s.id}
            className="absolute text-xl animate-star-twinkle"
            style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}
          >
            ✨
          </div>
        ))}
        <div className="absolute top-20 left-10 text-5xl opacity-30 animate-gentle-float">🌙</div>
      </div>
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
        .animate-star-twinkle { animation: star-twinkle 2s ease-in-out infinite; }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 🌴 نخيل ونجوم
// ═══════════════════════════════════════════════════════════
function PalmsStars() {
  return (
    <>
      <div className="fixed bottom-24 md:bottom-8 right-4 z-[55] text-5xl opacity-25 pointer-events-none">🌴</div>
      <div className="fixed bottom-24 md:bottom-8 left-4 z-[55] text-5xl opacity-25 pointer-events-none">🌴</div>
      <StarsCrescent />
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// 🎉 قصاصات
// ═══════════════════════════════════════════════════════════
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 4,
    color: ['#d4b062', '#7d613b', '#f9e3b0', '#a0825a'][i % 4],
  })), []);
  return (
    <>
      <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden" aria-hidden="true">
        {pieces.map((p) => (
          <div
            key={p.id}
            className="absolute w-2 h-3 animate-confetti-fall"
            style={{
              left: `${p.left}%`,
              top: '-20px',
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall { animation: confetti-fall linear infinite; }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// ❄️ ثلج
// ═══════════════════════════════════════════════════════════
function Snowflakes() {
  const flakes = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 5, duration: 8 + Math.random() * 6,
  })), []);
  return (
    <>
      <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden" aria-hidden="true">
        {flakes.map((f) => (
          <div
            key={f.id}
            className="absolute text-xl text-white/60 animate-snow-fall"
            style={{ left: `${f.left}%`, top: '-20px', animationDelay: `${f.delay}s`, animationDuration: `${f.duration}s` }}
          >
            ❄️
          </div>
        ))}
      </div>
      <style>{`
        @keyframes snow-fall {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(40px); opacity: 0; }
        }
        .animate-snow-fall { animation: snow-fall linear infinite; }
      `}</style>
    </>
  );
}
