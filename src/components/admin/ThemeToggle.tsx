/**
 * ThemeToggle — تبديل الوضع الليلي للوحة الإدارة
 */
'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('bfl_admin_theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function applyTheme(t: 'light' | 'dark') {
    const admin = document.querySelector('[data-admin-root]');
    if (admin) {
      if (t === 'dark') admin.classList.add('dark');
      else admin.classList.remove('dark');
    }
  }

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('bfl_admin_theme', next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-cream-100"
      title={theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}
