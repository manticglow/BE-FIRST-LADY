/**
 * CustomerNotesEditor — تحرير ملاحظات داخلية عن العميلة
 * ═══════════════════════════════════════════════════════════
 * - مرئي للمالكة والموظفات فقط
 * - ما يظهر للعميلة
 * - حفظ تلقائي بعد توقّف الكتابة
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { StickyNote, Save, Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  customerId: string;
  initialNotes: string | null;
  compact?: boolean;
}

export default function CustomerNotesEditor({ customerId, initialNotes, compact = false }: Props) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Autosave بعد توقّف الكتابة
  useEffect(() => {
    if (notes === (initialNotes || '')) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(), 1500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/customers/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'فشل الحفظ');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-2xl ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
          <StickyNote className="w-3.5 h-3.5" />
          ملاحظات داخليّة · للموظفات فقط
        </div>
        <div className="text-[10px] text-amber-700/80 flex items-center gap-1">
          {saving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              جارِ الحفظ
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              تم الحفظ
            </>
          ) : (
            <span className="opacity-60">يُحفظ تلقائياً</span>
          )}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="مثلاً: حسّاسة من الصبغات القويّة · تحبّ قهوة بدون سكّر · لا تلمسي الوجه..."
        rows={compact ? 2 : 4}
        className="w-full bg-white/60 border border-amber-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-amber-400"
      />

      <p className="text-[10px] text-amber-700/70 mt-1.5">
        🔒 هذي الملاحظات ما تظهر للعميلة أبداً · فقط للمالكة والموظفات
      </p>
    </div>
  );
}
