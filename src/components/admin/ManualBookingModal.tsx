/**
 * ManualBookingModal — نافذة حجز يدوي (walk-in / phone)
 * ═══════════════════════════════════════════════════════════
 * - خطوة 1: بيانات العميلة (اسم + جوال)
 * - خطوة 2: الخدمات
 * - خطوة 3: الوقت والموظفة
 * - خطوة 4: الدفع (مدفوع / مش مدفوع)
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  X, User, Phone, Calendar, Clock, Sparkles,
  CheckCircle2, Loader2, ChevronLeft, ChevronRight,
  CreditCard, Banknote, Smartphone, Wallet, Plus,
} from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/utils';

interface Service {
  id: string;
  name_ar: string;
  price: number;
  duration_min: number;
  category_id: string | null;
}

interface Staff {
  id: string;
  name: string;
  job_title: string;
}

interface Props {
  services: Service[];
  staff: Staff[];
  onClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

const PAYMENT_METHODS = [
  { value: 'cash',     label: 'نقدي',       icon: Banknote },
  { value: 'mada',     label: 'مدى',        icon: CreditCard },
  { value: 'applepay', label: 'Apple Pay',  icon: Smartphone },
  { value: 'transfer', label: 'تحويل بنكي', icon: Wallet },
] as const;

export default function ManualBookingModal({ services, staff, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [staffId, setStaffId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  // اختار العميلة الحسابيّة
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((s, sv) => s + Number(sv.price), 0);
  const totalDuration = selectedServices.reduce((s, sv) => s + Number(sv.duration_min), 0);

  // فلترة الخدمات
  const filteredServices = services.filter((s) =>
    s.name_ar.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // تحقّق خطوة بخطوة
  const canNext = step === 1
    ? customer.name.trim().length >= 2 && /^0?5\d{8}$/.test(customer.phone.replace(/\s/g, ''))
    : step === 2
    ? selectedServiceIds.length > 0
    : step === 3
    ? date && time
    : true;

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/bookings/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name.trim(),
          customer_phone: customer.phone.replace(/\s/g, ''),
          booking_date: date,
          booking_time: time,
          service_ids: selectedServiceIds,
          staff_id: staffId || null,
          notes: notes || null,
          payment_status: paymentStatus,
          payment_method: paymentStatus === 'paid' ? paymentMethod : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل إنشاء الحجز');
        return;
      }
      toast.success(data.message);
      onClose();
      router.refresh();
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in max-h-[95vh] flex flex-col">

        {/* ═══ Header ═══ */}
        <div className="relative bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 p-5 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="editorial-eyebrow text-gold-light/80 mb-1">MANUAL BOOKING</div>
          <h2 className="font-ar-display text-xl md:text-2xl font-bold">
            حجز يدوي للعميلة
          </h2>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step >= n ? 'bg-cream-50' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <div className="text-[11px] opacity-80 mt-2 flex items-center justify-between">
            <span>الخطوة {step} من 4</span>
            <span>
              {step === 1 && 'بيانات العميلة'}
              {step === 2 && 'الخدمات'}
              {step === 3 && 'الوقت والموظفة'}
              {step === 4 && 'الدفع والتأكيد'}
            </span>
          </div>
        </div>

        {/* ═══ Content ═══ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ─── Step 1: Customer ─── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  <User className="w-3.5 h-3.5 inline ml-1" />
                  اسم العميلة *
                </label>
                <input
                  type="text"
                  autoFocus
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="مثال: سارة الزهراني"
                  className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline ml-1" />
                  رقم الجوال *
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white font-en-display text-right"
                />
                <p className="text-[10px] text-ink-soft mt-1">
                  لو العميلة مسجّلة عندنا · راح يُربط حجزها بحسابها تلقائياً
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثلاً · حساسيّة من بعض المنتجات..."
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* ─── Step 2: Services ─── */}
          {step === 2 && (
            <div className="space-y-3">
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="🔍 ابحثي عن خدمة..."
                className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white text-sm"
              />

              <div className="max-h-80 overflow-y-auto space-y-1.5 border border-cream-200 rounded-xl p-2">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-8 text-sm text-ink-soft">
                    ما فيه خدمات مطابقة
                  </div>
                ) : filteredServices.map((s) => {
                  const selected = selectedServiceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={`w-full p-3 rounded-xl border-2 transition-all text-right flex items-center gap-3 ${
                        selected
                          ? 'bg-gold-deep/5 border-gold-deep'
                          : 'bg-cream-50 border-transparent hover:border-cream-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selected ? 'bg-gold-deep border-gold-deep' : 'border-cream-300'
                      }`}>
                        {selected && <CheckCircle2 className="w-3 h-3 text-cream-50" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-ink truncate">{s.name_ar}</div>
                        <div className="text-[11px] text-ink-soft flex items-center gap-2 mt-0.5">
                          <span>{formatDuration(s.duration_min)}</span>
                          <span>·</span>
                          <span className="font-en-display font-bold text-gold-deep">
                            {formatPrice(s.price, { showFrom: false })}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Summary */}
              {selectedServices.length > 0 && (
                <div className="bg-gradient-to-l from-gold-light/15 to-transparent rounded-xl p-3 border border-gold-light/30">
                  <div className="text-[11px] text-ink-soft mb-1">المحدّد:</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-ink">{selectedServices.length}</span>
                      <span className="text-xs text-ink-soft"> خدمة · {formatDuration(totalDuration)}</span>
                    </div>
                    <div className="font-en-display font-bold text-lg text-gold-deep">
                      {formatPrice(totalPrice, { showFrom: false })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Time & Staff ─── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline ml-1" />
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    <Clock className="w-3.5 h-3.5 inline ml-1" />
                    الوقت
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    step="900"
                    className="w-full px-3 py-3 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-1.5">
                  الموظفة (اختياري)
                </label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white"
                >
                  <option value="">— تحديد لاحقاً —</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.job_title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                💡 لو ما حدّدتِ موظفة · ممكن تربطيها لاحقاً من صفحة الحجوزات
              </div>
            </div>
          )}

          {/* ─── Step 4: Payment & Review ─── */}
          {step === 4 && (
            <div className="space-y-4">

              {/* Summary */}
              <div className="bg-gradient-to-br from-gold-light/10 to-cream-50 border border-gold-light/30 rounded-2xl p-4">
                <div className="editorial-eyebrow text-ink-soft mb-3">ORDER SUMMARY</div>

                <div className="space-y-2 pb-3 border-b border-gold-light/20">
                  <SummaryRow icon={User} label="العميلة" value={`${customer.name} · ${customer.phone}`} />
                  <SummaryRow icon={Calendar} label="التاريخ" value={`${date} · ${time}`} />
                  <SummaryRow icon={Sparkles} label="الخدمات" value={`${selectedServices.length} خدمة · ${formatDuration(totalDuration)}`} />
                  {staffId && (
                    <SummaryRow
                      icon={User}
                      label="الموظفة"
                      value={staff.find((s) => s.id === staffId)?.name || '-'}
                    />
                  )}
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">المجموع</span>
                  <span className="font-en-display font-bold text-2xl text-gold-deep">
                    {formatPrice(totalPrice, { showFrom: false })}
                  </span>
                </div>
              </div>

              {/* Payment status */}
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">حالة الدفع</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentStatus('paid')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                      paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-cream-50 text-ink-soft border-cream-200'
                    }`}
                  >
                    ✅ مدفوع
                  </button>
                  <button
                    onClick={() => setPaymentStatus('unpaid')}
                    className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                      paymentStatus === 'unpaid'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-cream-50 text-ink-soft border-cream-200'
                    }`}
                  >
                    ⏳ غير مدفوع
                  </button>
                </div>
              </div>

              {/* Payment method */}
              {paymentStatus === 'paid' && (
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-2">طريقة الدفع</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value)}
                        className={`py-2.5 px-3 rounded-xl font-bold text-sm transition-all border flex items-center gap-2 ${
                          paymentMethod === m.value
                            ? 'bg-gold-deep text-cream-50 border-gold-deep'
                            : 'bg-white text-ink border-cream-200 hover:border-gold-light'
                        }`}
                      >
                        <m.icon className="w-4 h-4" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ Footer navigation ═══ */}
        <div className="p-4 border-t border-cream-200 bg-cream-50/50 shrink-0 flex items-center gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              disabled={submitting}
              className="px-4 py-3 rounded-xl bg-white text-ink-soft border border-cream-200 font-bold text-sm hover:bg-cream-100 transition-colors flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!canNext}
              className="flex-1 py-3 rounded-xl bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-ar-display font-bold flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition-transform"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting || !canNext}
              className="flex-1 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-cream-50 font-ar-display font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] transition-transform"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'جارِ الحفظ...' : 'تأكيد الحجز'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-gold-deep shrink-0" />
      <span className="text-ink-soft">{label}:</span>
      <span className="text-ink font-bold truncate">{value}</span>
    </div>
  );
}
