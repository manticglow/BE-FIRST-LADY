/**
 * Push notification helpers for staff workflows
 * ═══════════════════════════════════════════════════════════
 * - كل دالّة تعمل fire-and-forget (لا تكسر الـAPI لو فشل الإرسال)
 * - يستخدم sendWebPushToUser تحت الكواليس
 */
import { sendWebPushToUser } from './web-push';
import { logger } from './logger';

const log = logger.scope('push-helpers');

/** إشعار للموظّفة عند مراجعة طلب (موافقة/رفض) */
export async function notifyRequestReview(
  userId: string,
  kind: 'leave' | 'permission' | 'swap',
  status: 'approved' | 'rejected',
  summary: string,
) {
  const kindAr = { leave: 'الإجازة', permission: 'الإذن', swap: 'تبديل الدوام' }[kind];
  const emoji = status === 'approved' ? '✓' : '✗';
  const action = status === 'approved' ? 'تمت الموافقة على' : 'تم رفض';

  try {
    await sendWebPushToUser(userId, {
      title: `${emoji} ${action} طلب ${kindAr}`,
      body: summary,
      url: '/admin',
      tag: `request-${kind}-${status}`,
      data: { kind, status },
    });
  } catch (e) {
    log.warn('request review push failed', { err: e });
  }
}

/** إشعار للزميلة عند استلام طلب تبديل جديد */
export async function notifySwapRecipient(
  recipientId: string,
  requesterName: string,
  requesterDate: string,
) {
  try {
    await sendWebPushToUser(recipientId, {
      title: '🔄 طلب تبديل دوام جديد',
      body: `${requesterName} تطلب تبديل يوم ${requesterDate} معكِ`,
      url: '/admin',
      tag: 'swap-new',
    });
  } catch (e) {
    log.warn('swap recipient push failed', { err: e });
  }
}

/** إشعار للطالبة عندما تردّ الزميلة */
export async function notifySwapResponse(
  requesterId: string,
  recipientName: string,
  accepted: boolean,
) {
  try {
    await sendWebPushToUser(requesterId, {
      title: accepted ? '✓ وافقت الزميلة' : '✗ اعتذرت الزميلة',
      body: accepted
        ? `${recipientName} وافقت على التبديل · بانتظار الإدارة الحين`
        : `${recipientName} اعتذرت عن التبديل`,
      url: '/admin',
      tag: 'swap-response',
    });
  } catch (e) {
    log.warn('swap response push failed', { err: e });
  }
}

/** إشعار للموظّفة عند تعيين حجز جديد لها */
export async function notifyNewBookingAssigned(
  staffUserId: string,
  customerName: string,
  bookingDate: string,
  bookingTime: string,
) {
  try {
    await sendWebPushToUser(staffUserId, {
      title: '🌸 حجز جديد تمّ تعيينه لكِ',
      body: `${customerName} · ${bookingDate} ${bookingTime.slice(0, 5)}`,
      url: '/admin',
      tag: 'new-booking',
    });
  } catch (e) {
    log.warn('new booking push failed', { err: e });
  }
}

/** إشعار للمالكة/المديرة عند طلب جديد من موظّفة */
export async function notifyManagersNewRequest(
  kind: 'leave' | 'permission' | 'swap',
  staffName: string,
) {
  try {
    // جلب كل المدراء
    const { createAdminClient } = await import('./supabase/server');
    const admin = createAdminClient();
    const { data: managers } = await admin
      .from('profiles')
      .select('id')
      .in('role', ['owner', 'manager']);

    const kindAr = { leave: 'إجازة', permission: 'إذن', swap: 'تبديل دوام' }[kind];
    const emoji = { leave: '🏖️', permission: '⏰', swap: '🔄' }[kind];

    const ids = (managers as { id: string }[] | null)?.map((m) => m.id) || [];
    await Promise.all(
      ids.map((id) =>
        sendWebPushToUser(id, {
          title: `${emoji} طلب ${kindAr} جديد`,
          body: `من ${staffName} · يحتاج مراجعة`,
          url: '/admin/requests',
          tag: `new-${kind}-request`,
        }).catch(() => {}),
      ),
    );
  } catch (e) {
    log.warn('managers push failed', { err: e });
  }
}
