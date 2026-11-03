/**
 * /admin/templates — إدارة قوالب الرسائل
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TemplatesManager from '@/components/admin/TemplatesManager';

export const dynamic = 'force-dynamic';

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/templates');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !['owner', 'manager'].includes(role)) redirect('/admin');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
          MESSAGE TEMPLATES
        </div>
        <h1 className="font-ar-display text-2xl md:text-4xl font-bold text-gold-deep">
          قوالب الرسائل
        </h1>
        <p className="text-ink-soft text-sm mt-1.5">
          عدّلي نصوص الرسائل اللي تُرسَل للعميلات · تأكيد الحجز · التذكيرات · بطاقات الهديّة · إلخ
        </p>
      </div>

      <TemplatesManager />
    </div>
  );
}
