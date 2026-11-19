/**
 * AdminLogoutButton — زرّ خروج من لوحة الأدمن
 * ═══════════════════════════════════════════════════════════
 * - fetch للـAPI (بدل form POST) لتجنّب عرض JSON الخام
 * - توست وداعي قبل التحويل
 */
'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      toast.success(data.message || 'نراكِ قريباً · حفظكِ الله 🤍');
      setTimeout(() => { window.location.href = '/login'; }, 600);
    } catch {
      toast.error('تعثّر الخروج · حاولي مرّة ثانية');
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="group w-full flex items-center gap-2 px-3 py-2.5 text-xs text-cream-100/80 hover:text-white hover:bg-white/10 transition-all font-bold disabled:opacity-50"
      style={{ borderRadius: '2px' }}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5 group-hover:translate-x-[-2px] transition-transform" />
      )}
      <span>{busy ? 'جاري الخروج...' : 'تسجيل خروج'}</span>
    </button>
  );
}
