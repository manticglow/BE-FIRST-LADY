/**
 * ThemeProvider — يطبّق الثيم النشط على كل الموقع
 * ═══════════════════════════════════════════════════════════
 * - يجلب الثيم النشط من /api/theme (مع cache)
 * - يحقن CSS variables على الـ:root
 * - يعرض شارة في أعلى الصفحة (badge)
 * - يعرض زخارف (palms · lanterns · hearts · ...)
 */
'use client';

import { useEffect, useState } from 'react';
import ThemeDecorations from './ThemeDecorations';
import ThemeBadge from './ThemeBadge';

interface Theme {
  code: string;
  name_ar: string;
  primary_color: string;
  accent_color: string;
  surface_color: string | null;
  text_color: string | null;
  badge_text: string | null;
  badge_emoji: string | null;
  decoration: string | null;
  banner_overlay: string | null;
}

export default function ThemeProvider() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    fetch('/api/theme')
      .then((r) => r.json())
      .then((d) => {
        if (d.theme) {
          setTheme(d.theme);
          applyThemeVars(d.theme);
        }
      })
      .catch(() => {});
  }, []);

  if (!theme || theme.code === 'default') return null;

  return (
    <>
      {theme.badge_text && (
        <ThemeBadge text={theme.badge_text} emoji={theme.badge_emoji || ''} />
      )}
      {theme.decoration && <ThemeDecorations type={theme.decoration} />}
    </>
  );
}

/** يحقن CSS vars على الـ:root */
function applyThemeVars(theme: Theme) {
  const root = document.documentElement;
  // نحقن vars إضافيّة · ما نعدّل الأصليّة
  root.style.setProperty('--theme-primary', theme.primary_color);
  root.style.setProperty('--theme-accent', theme.accent_color);
  if (theme.surface_color) root.style.setProperty('--theme-surface', theme.surface_color);
  if (theme.text_color) root.style.setProperty('--theme-text', theme.text_color);

  // class على الـbody عشان نقدر نضيف styles خاصّة بالثيم
  document.body.setAttribute('data-theme', theme.code);
}
