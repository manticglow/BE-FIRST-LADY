/**
 * Admin · Expenses
 */
import ExpensesManager from '@/components/admin/ExpensesManager';
import { TrendingDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ExpensesPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="editorial-eyebrow text-ink-soft mb-1">EXPENSES</div>
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep flex items-center gap-2">
          <TrendingDown className="w-7 h-7" />
          المصروفات
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          سجّلي كل مصروفات الصالون · لحساب الربح الصافي الحقيقي
        </p>
      </div>

      <ExpensesManager />
    </div>
  );
}
