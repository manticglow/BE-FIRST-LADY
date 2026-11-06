'use client';

import { Clock, Scissors } from 'lucide-react';

interface HourRow {
  section: 'spa' | 'salon';
  open_time: string;
  close_time: string;
  note: string | null;
}

function formatTime(time: string): string {
  const [h] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:00 ${period}`;
}

function HourCard({
  title, label, icon: Icon, openTime, closeTime, note, isOpen,
}: {
  title: string; label: string; icon: any;
  openTime: string; closeTime: string; note: string; isOpen: boolean;
}) {
  return (
    <article className="relative bg-white rounded-2xl p-4 shadow-card hover:shadow-gold-soft transition-shadow">
      {/* الأيقونة + العنوان + حالة */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center text-gold-deep shrink-0">
          <Icon className="w-5 h-5" />
          <span
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
              isOpen ? 'bg-success animate-pulse' : 'bg-danger'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-en-label text-[9px] tracking-[0.25em] text-gold-light">{label}</div>
          <h3 className="font-ar-display text-sm font-bold text-ink leading-tight">{title}</h3>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isOpen ? 'bg-success/10 text-success-deep' : 'bg-danger/10 text-danger'
          }`}
        >
          {isOpen ? 'مفتوح' : 'مغلق'}
        </span>
      </div>

      {/* الوقت */}
      <div
        className="font-en-display text-base font-semibold text-gold-deep text-center bg-cream-50 rounded-xl py-2.5"
        dir="ltr"
      >
        {openTime}<span className="text-gold mx-1.5">–</span>{closeTime}
      </div>

      {/* الملاحظة */}
      <div className="text-[11px] text-ink-soft text-center mt-2">{note}</div>
    </article>
  );
}

export default function HoursSection({ hours }: { hours: HourRow[] }) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const spa = hours.find((h) => h.section === 'spa');
  const salon = hours.find((h) => h.section === 'salon');

  const isOpenNow = (open: string, close: string) => {
    const o = parseFloat(open.split(':')[0]);
    const c = parseFloat(close.split(':')[0]) || 24;
    return currentHour >= o && currentHour < c;
  };

  return (
    <section id="hours" className="py-12 md:py-16 bg-gradient-to-b from-cream-50 to-cream-100">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <span className="heading-eyebrow">HOURS</span>
        <h2 className="font-ar-display text-2xl md:text-3xl font-bold text-gold-deep mt-1">ساعات العمل</h2>
        <span className="divider-gold" />

        <div className="grid gap-3 mt-6 md:grid-cols-2 max-w-xl mx-auto">
          {spa && (
            <HourCard
              title="قسم السبا"
              label="SPA"
              icon={Clock}
              openTime={formatTime(spa.open_time)}
              closeTime={formatTime(spa.close_time)}
              note="١٢ ساعة يومياً"
              isOpen={isOpenNow(spa.open_time, spa.close_time)}
            />
          )}
          {salon && (
            <HourCard
              title="قسم الشعر"
              label="SALON"
              icon={Scissors}
              openTime={formatTime(salon.open_time)}
              closeTime={formatTime(salon.close_time)}
              note="١٠ ساعات يومياً"
              isOpen={isOpenNow(salon.open_time, salon.close_time)}
            />
          )}
        </div>

        {/* شارات */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-amber-50 text-warning border border-amber-200/50">
            ⚠ يُمنع اصطحاب الأطفال
          </span>
          <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-gold-light/10 text-gold-deep border border-gold-light/30">
            ✦ 7 أيام في الأسبوع
          </span>
        </div>
      </div>
    </section>
  );
}
