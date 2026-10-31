/**
 * Audit Log — تسجيل العمليّات الحسّاسة
 * ═══════════════════════════════════════════════════════════
 * من فعل · متى · ماذا · من أين (IP)
 */
import { createAdminClient } from '@/lib/supabase/server';

export type AuditAction =
  // ─── Auth ───
  | 'auth.login'
  | 'auth.logout'
  | 'auth.otp.send'
  | 'auth.otp.verify'
  | 'auth.password.reset'
  | 'auth.password.change'
  // ─── Bookings ───
  | 'booking.create'
  | 'booking.update'
  | 'booking.cancel'
  | 'booking.delete'
  | 'booking.manual_create'
  // ─── Gift Cards ───
  | 'gift_card.issue'
  | 'gift_card.redeem'
  | 'gift_card.deactivate'
  // ─── Customers ───
  | 'customer.notes_update'
  | 'customer.delete'
  // ─── Expenses ───
  | 'expense.create'
  | 'expense.delete'
  // ─── Admin ───
  | 'admin.staff.create'
  | 'admin.staff.update'
  | 'admin.staff.delete'
  | 'admin.settings.update'
  | 'admin.data.export';

interface LogOptions {
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string;
}

/**
 * سجّلي عمليّة · fire-and-forget (ما ينتظر الـresult)
 */
export async function auditLog(opts: LogOptions): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      user_id: opts.userId || null,
      user_email: opts.userEmail || null,
      user_role: opts.userRole || null,
      action: opts.action,
      resource_type: opts.resourceType || null,
      resource_id: opts.resourceId || null,
      metadata: opts.metadata || null,
      ip_address: opts.ipAddress || null,
      user_agent: opts.userAgent || null,
      success: opts.success ?? true,
      error_message: opts.errorMessage || null,
    });
  } catch (err) {
    // لا نكسر العمليّة الأصليّة لو فشل الـaudit
    console.error('[audit-log] failed:', err);
  }
}

/**
 * استخراج بيانات الـrequest للـaudit
 */
export function extractRequestInfo(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    null;
  const ua = req.headers.get('user-agent') || null;
  return { ip, ua };
}
