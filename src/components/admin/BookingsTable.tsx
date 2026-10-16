/**
 * BookingsTable — جدول الحجوزات في لوحة المالكة
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Calendar, Clock, MoreVertical, Search, Gift, Send, Star, Printer, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatPrice, waLink } from '@/lib/utils';
import type { Booking, BookingItem } from '@/types/database';

// حقول الهدية (موسّعة من النوع الأصلي)
type BookingWithGift = Booking & {
  items?: BookingItem[];
  is_gift?: boolean;
  gift_from_name?: string | null;
  gift_from_phone?: string | null;
  gift_message?: string | null;
  invitation_sent_at?: string | null;
};

const STATUS_OPTIONS: { value: Booking['status']; label: string; class: string }[] = [
  { value: 'pending',     label: 'معلّق',    class: 'bg-warning/15 text-warning' },
  { value: 'confirmed',   label: 'مؤكّد',    class: 'bg-success/15 text-success' },
  { value: 'in_progress', label: 'جاري',     class: 'bg-blue-100 text-blue-700' },
  { value: 'completed',   label: 'مكتمل',    class: 'bg-cream-200 text-ink-soft' },
  { value: 'cancelled',   label: 'ملغي',     class: 'bg-danger/15 text-danger' },
  { value: 'no_show',     label: 'لم تحضر',  class: 'bg-danger/15 text-danger' },
];

export default function BookingsTable({
  bookings, counts, activeStatus,
}: {
  bookings: BookingWithGift[];
  counts: Record<string, number>;
  activeStatus?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: Booking['status']) {
    setUpdating(id);
    const supabase = createClient();
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) {
      toast.error('فشل التحديث');
    } else {
      toast.success('تم التحديث');
      router.refresh();
    }
    setUpdating(null);
  }

  // إرسال رابط تقييم للعميلة
  function sendReviewLink(b: BookingWithGift) {
    const reviewUrl = `${window.location.origin}/review/${b.booking_number}`;
    const message = encodeURIComponent(
      `أهلاً ${b.customer_name} 💛\n\n` +
      `شكراً لزيارتكِ Be First Lady 🌸\n` +
      `رأيكِ يهمّنا — خذي دقيقة وقيّمي تجربتكِ:\n${reviewUrl}\n\n` +
      `نتمنى نراكِ قريباً مرة أخرى ✨`
    );
    const phone = b.customer_phone.replace(/\D/g, '').replace(/^0/, '966');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    toast.success('فُتح الواتساب لإرسال رابط التقييم ⭐');
  }

  // إرسال الدعوة واتساب للمستقبِلة + تسجيل الوقت
  async function sendInvitation(b: BookingWithGift) {
    if (!b.is_gift) return;

    const inviteUrl = `${window.location.origin}/invite/${b.booking_number}`;
    const message = encodeURIComponent(
      `✨ أهلاً ${b.customer_name} 💛\n\n` +
      `عندكِ دعوة فاخرة من ${b.gift_from_name} في Be First Lady — المدينة المنوّرة 🌸\n\n` +
      `اضغطي الرابط لعرض الدعوة والـ QR:\n${inviteUrl}\n\n` +
      `📅 الموعد: ${b.booking_date} الساعة ${b.booking_time.slice(0, 5)}\n` +
      `#️⃣ رقم الحجز: ${b.booking_number}\n\n` +
      `نرحّب بكِ 💐`
    );

    // افتح واتساب برقم المستقبِلة
    const phone = b.customer_phone.replace(/\D/g, '').replace(/^0/, '966');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');

    // سجل وقت الإرسال
    const supabase = createClient();
    await supabase.from('bookings').update({ invitation_sent_at: new Date().toISOString() }).eq('id', b.id);
    toast.success('فتح الواتساب — تم تسجيل الإرسال 📩');
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (activeStatus) params.set('status', activeStatus);
    router.push(`/admin/bookings?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* فلاتر الحالة */}
      <div className="flex flex-wrap gap-2 items-center">
        <Link
          href="/admin/bookings"
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            !activeStatus ? 'bg-gold-deep text-cream-50 border-gold-deep' : 'bg-white text-ink border-cream-200 hover:border-gold-light'
          }`}
        >
          الكل
        </Link>
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/bookings?status=${opt.value}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeStatus === opt.value
                ? 'bg-gold-deep text-cream-50 border-gold-deep'
                : 'bg-white text-ink border-cream-200 hover:border-gold-light'
            }`}
          >
            {opt.label} {counts[opt.value] ? <span className="opacity-70">({counts[opt.value]})</span> : null}
          </Link>
        ))}
      </div>

      {/* بحث + تصدير */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحثي بالاسم أو الجوال أو رقم الحجز..."
            className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-cream-200 bg-white focus:border-gold outline-none text-sm"
          />
        </form>
        <a
          href="/api/admin/export/bookings"
          download
          className="btn-outline flex items-center gap-2 !py-2 !px-4 text-sm shrink-0"
          title="تصدير Excel"
        >
          <Download className="w-4 h-4" />
          Excel
        </a>
      </div>

      {/* الجدول */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-12 text-center text-ink-soft text-sm">
            ما فيه حجوزات بهذه المواصفات
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr className="text-right text-xs text-ink-soft font-bold">
                  <th className="p-3">رقم الحجز</th>
                  <th className="p-3">العميلة</th>
                  <th className="p-3">الموعد</th>
                  <th className="p-3">الخدمات</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className={`border-b border-cream-100 hover:bg-cream-50/50 ${b.is_gift ? 'bg-gold-light/5' : ''}`}>
                    <td className="p-3 font-en-display text-xs text-ink-soft">
                      <div className="flex items-center gap-1">
                        {b.is_gift && (
                          <span className="inline-flex items-center gap-1 bg-gold-deep text-cream-50 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            <Gift className="w-2.5 h-2.5" />
                            هدية
                          </span>
                        )}
                        <span>#{b.booking_number || b.id.slice(0, 6)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-ink">{b.customer_name}</div>
                      <a href={`tel:${b.customer_phone}`} className="text-xs text-ink-soft hover:text-gold-deep flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span className="font-en-display">{b.customer_phone}</span>
                      </a>
                      {b.is_gift && b.gift_from_name && (
                        <div className="text-[10px] text-gold-deep mt-1 italic">
                          🎁 من: {b.gift_from_name}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="text-xs text-ink flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gold-deep" />
                        <span className="font-en-display">{b.booking_date}</span>
                      </div>
                      <div className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-gold-deep" />
                        <span className="font-en-display">{b.booking_time.slice(0, 5)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-ink-soft max-w-[200px]">
                      {b.items?.map((i) => i.service_name).join('، ') || '-'}
                      {(b as any).staff_id && (
                        <div className="text-[10px] text-gold-deep mt-1">
                          👤 لدى الاختصاصية
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-en-display font-bold text-gold-deep">
                      {formatPrice(b.total)}
                    </td>
                    <td className="p-3">
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value as Booking['status'])}
                        disabled={updating === b.id}
                        className={`text-[11px] font-bold px-2 py-1 rounded-md border-0 outline-none cursor-pointer ${
                          STATUS_OPTIONS.find((o) => o.value === b.status)?.class || ''
                        }`}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {b.is_gift && (
                          <button
                            onClick={() => sendInvitation(b)}
                            className={`p-1.5 rounded-md transition-colors ${
                              b.invitation_sent_at
                                ? 'text-success hover:bg-success/10'
                                : 'text-gold-deep hover:bg-gold-light/20'
                            }`}
                            title={b.invitation_sent_at ? `أُرسلت ${new Date(b.invitation_sent_at).toLocaleString('en-GB')}` : 'إرسال الدعوة واتساب'}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {b.status === 'completed' && (
                          <button
                            onClick={() => sendReviewLink(b)}
                            className="p-1.5 hover:bg-gold-light/20 rounded-md text-gold-deep"
                            title="أرسلي رابط تقييم للعميلة"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <a
                          href={`/admin/bookings/${b.id}/invoice`}
                          target="_blank"
                          className="p-1.5 hover:bg-cream-100 rounded-md text-ink-soft"
                          title="فاتورة"
                        >
                          <Printer className="w-4 h-4" />
                        </a>
                        <a
                          href={b.is_gift ? `/invite/${b.booking_number}` : '#'}
                          target={b.is_gift ? '_blank' : undefined}
                          className="p-1.5 hover:bg-cream-100 rounded-md text-ink-soft"
                          title={b.is_gift ? 'معاينة الدعوة' : 'التفاصيل'}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
