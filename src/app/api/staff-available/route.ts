/**
 * GET /api/staff-available?date=YYYY-MM-DD&service_ids=id1,id2
 * ═══════════════════════════════════════════════════════════
 * يرجّع الاختصاصيات اللي:
 *   - تقدم كل الخدمات المختارة
 *   - عندها جدول دوام في هذا اليوم
 *   - غير مُجدْول في أيام إغلاق
 * مع ساعات دوامها لذلك اليوم
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  const serviceIdsStr = req.nextUrl.searchParams.get('service_ids');
  if (!date) return NextResponse.json({ error: 'التاريخ مطلوب' }, { status: 400 });

  const serviceIds = (serviceIdsStr || '').split(',').filter(Boolean);
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();

  const supabase = await createClient();

  // جلب كل الموظفات المفعّلات
  const { data: allStaff } = await supabase
    .from('staff')
    .select('*, services:staff_services(service_id), schedule:staff_schedule(*)')
    .eq('is_active', true)
    .order('display_order');

  // جلب أيام الإغلاق الخاصة لكل موظفة
  const { data: blocked } = await supabase
    .from('blocked_dates')
    .select('staff_id')
    .eq('date', date);

  const blockedStaffIds = new Set((blocked || []).map((b) => b.staff_id).filter(Boolean));

  const result = (allStaff || [])
    .map((s: any) => {
      // تحقّق: تقدم كل الخدمات المختارة؟
      const staffServiceIds = (s.services || []).map((ss: any) => ss.service_id);
      const providesAll = serviceIds.length === 0
        || serviceIds.every((sid) => staffServiceIds.includes(sid));

      // جدول هذا اليوم
      const todaySchedule = (s.schedule || []).find((sc: any) => sc.day_of_week === dayOfWeek);
      const workingToday = todaySchedule && !todaySchedule.is_off;

      // ليست في أيام إغلاق
      const notBlocked = !blockedStaffIds.has(s.id);

      return {
        id: s.id,
        name: s.name,
        job_title: s.job_title,
        avatar_url: s.avatar_url,
        specialties: s.specialties || [],
        providesAll,
        workingToday,
        notBlocked,
        schedule: todaySchedule || null,
        available: providesAll && workingToday && notBlocked,
      };
    });

  return NextResponse.json({ staff: result });
}
