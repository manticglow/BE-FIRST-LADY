/**
 * Admin — مراجعة طلبات الإجازات
 */
import LeavesReviewer from '@/components/admin/LeavesReviewer';

export const dynamic = 'force-dynamic';

export default function LeavesAdminPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">طلبات الإجازات</h1>
        <p className="text-ink-soft text-sm mt-1">
          اعتماد/رفض طلبات الموظفات — الإجازات المعتمدة تُضاف للتقويم تلقائياً
        </p>
      </div>
      <LeavesReviewer />
    </div>
  );
}
