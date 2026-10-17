/**
 * RemindersClient — واجهة إرسال التذكيرات
 */
'use client';

import { useState } from 'react';
import { Bell, MessageCircle, Clock, Calendar, Phone, Check, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: string;
  booking_number: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  customer_phone: string;
  total: number;
  items?: { service_name: string }[];
}

interface Props {
  bookings: Booking[];
  today: string;
  tomorrow: string;
  dayAfter: string;
}

export default function RemindersClient({ bookings, today, tomorrow, dayAfter }: Props) {
  const [sent, setSent] = useState<Set<string>>(new Set());

  function buildMessage(b: Booking, isToday: boolean) {
    const serviceNames = b.items?.map((i) => i.service_name).join('، ') || 'الخدمة المختارة';
    const greeting = isToday ? 'صباح الخير' : 'مساء الخير';
    const prefix = isToday ? '🌸 تذكير بموعدكِ اليوم في Be First Lady:' : '✨ تذكير بموعدكِ بكرا في Be First Lady:';

    return (
      `${greeting} ${b.customer_name} 💛\n\n` +
      `${prefix}\n\n` +
      `📅 ${b.booking_date}\n` +
      `🕒 الساعة ${b.booking_time.slice(0, 5)}\n` +
      `💆‍♀️ ${serviceNames}\n\n` +
      `نشوفكِ بإذن الله 🌸\n` +
      `لو احتجتِ تعديل أو إلغاء · أعلمينا الآن`
    );
  }

  function sendOne(b: Booking) {
    const isToday = b.booking_date === today;
    const msg = encodeURIComponent(buildMessage(b, isToday));
    const phone = b.customer_phone.replace(/\D/g, '').replace(/^0/, '966');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    setSent((prev) => new Set(prev).add(b.id));
    toast.success(`فُتح الواتساب لـ ${b.customer_name}`);
  }

  async function sendAll(list: Booking[]) {
    if (list.length === 0) return;
    if (!confirm(`سيُفتح ${list.length} تبويب واتساب · متأكدة؟`)) return;

    for (let i = 0; i < list.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      sendOne(list[i]);
    }
  }

  const todayList = bookings.filter((b) => b.booking_date === today);
  const tomorrowList = bookings.filter((b) => b.booking_date === tomorrow);
  const dayAfterList = bookings.filter((b) => b.booking_date === dayAfter);

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
        <Bell className="w-12 h-12 text-ink-soft/30 mx-auto mb-3" />
        <p className="text-ink-soft">ما فيه حجوزات مؤكّدة في اليومين الجايين</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section
        title="اليوم"
        emoji="🔴"
        bookings={todayList}
        onSendOne={sendOne}
        onSendAll={() => sendAll(todayList)}
        sent={sent}
      />
      <Section
        title="بكرا"
        emoji="🟡"
        bookings={tomorrowList}
        onSendOne={sendOne}
        onSendAll={() => sendAll(tomorrowList)}
        sent={sent}
        highlight
      />
      <Section
        title="بعد بكرا"
        emoji="🟢"
        bookings={dayAfterList}
        onSendOne={sendOne}
        onSendAll={() => sendAll(dayAfterList)}
        sent={sent}
      />
    </div>
  );
}

function Section({
  title, emoji, bookings, onSendOne, onSendAll, sent, highlight,
}: {
  title: string;
  emoji: string;
  bookings: Booking[];
  onSendOne: (b: Booking) => void;
  onSendAll: () => void;
  sent: Set<string>;
  highlight?: boolean;
}) {
  if (bookings.length === 0) return null;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${highlight ? 'border-gold-deep shadow-lg' : 'border-cream-200'}`}>
      <div className={`px-5 py-4 flex items-center justify-between border-b ${highlight ? 'bg-gradient-to-l from-gold-light/10 to-transparent border-gold-light/30' : 'bg-cream-50 border-cream-200'}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <h2 className="font-ar-display text-xl font-bold text-gold-deep">
            {title}
          </h2>
          <span className="text-xs bg-cream-200 text-ink-soft px-2 py-0.5 rounded-full font-en-display">
            {bookings.length}
          </span>
        </div>
        {bookings.length > 1 && (
          <button
            onClick={onSendAll}
            className="flex items-center gap-1.5 text-xs font-bold bg-gold-deep text-cream-50 px-3 py-1.5 rounded-lg hover:bg-ink transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            أرسلي الكل
          </button>
        )}
      </div>

      <ul className="divide-y divide-cream-100">
        {bookings.map((b) => (
          <li key={b.id} className="p-4 flex items-center justify-between gap-3 hover:bg-cream-50/50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-ink">{b.customer_name}</span>
                {sent.has(b.id) && (
                  <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    أُرسل
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gold-deep" />
                  <span className="font-en-display">{b.booking_time.slice(0, 5)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gold-deep" />
                  <span className="font-en-display">{b.customer_phone}</span>
                </span>
              </div>
              {b.items && b.items.length > 0 && (
                <div className="text-[11px] text-ink-soft/80 mt-1 truncate">
                  {b.items.map((i) => i.service_name).join('، ')}
                </div>
              )}
            </div>
            <button
              onClick={() => onSendOne(b)}
              className="shrink-0 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              تذكير
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
