/**
 * ThemeBadge — شارة الثيم في أعلى الصفحة
 * تظهر فوق الـheader · قابلة للإخفاء من المستخدم
 */
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  text: string;
  emoji: string;
}

export default function ThemeBadge({ text, emoji }: Props) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // اقرئي من localStorage
    try {
      const key = `bfl-theme-badge-${text}`;
      const dismissed = localStorage.getItem(key);
      setHidden(!!dismissed);
    } catch {
      setHidden(false);
    }
  }, [text]);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(`bfl-theme-badge-${text}`, '1');
    } catch {}
  }

  if (hidden) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[80] py-2 px-4 flex items-center justify-center gap-2 text-center text-xs md:text-sm text-white font-bold shadow-md"
      style={{
        background: `linear-gradient(90deg, var(--theme-primary, #7d613b), var(--theme-accent, #d4b062), var(--theme-primary, #7d613b))`,
      }}
    >
      {emoji && <span className="text-base md:text-lg">{emoji}</span>}
      <span className="font-ar-display">{text}</span>
      {emoji && <span className="text-base md:text-lg">{emoji}</span>}
      <button
        onClick={dismiss}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-1"
        aria-label="إخفاء"
      >
        <X className="w-3 h-3 md:w-4 md:h-4" />
      </button>
    </div>
  );
}
