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
  title, label, icon: Icon, openTime, closeTime, note, isOpen
}: {
  title: string; label: string; icon: any;
  openTime: string; closeTime: string; note: string; isOpen: boolean;
}) {
  return (
    <article className="relative bg-gradient-to-br from-white to-cream-50 border border-gold-light/15 rounded-2xl p-5 pt-10 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 transition-transform">
      {/* شارة الحالة */}
      <span className={`absolute top-3 right-4 font-en-display italic text-sm font-bold ${isOpen ? 'text-success' : 'text-danger'}`}>
        {isOpen ? 'مفتوح' : 'مغلق'}
      </span>

      {/* الأيقونة مع نقطة الحالة */}
      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-cream-50 to-cream-100 border-[1.5px] border-gold-light flex items-center justify-center text-gold flex-shrink-0">
        <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-white ${isOpen ? 'bg-success animate-ping-dot' : 'bg-danger'}`} />
        <Icon className="w-6 h-6" />
      </div>

      {/* المعلومات */}
      <div className="flex-1">
        <span className="font-en-label text-[10px] tracking-[0.25em] text-gold-light">{label}</span>
        <h3 className="font-ar-display text-base font-bold text-gold-deep">{title}</h3>
        <div className="font-en-display text-[17px] font-semibold text-ink" dir="ltr">
          {openTime}<span className="text-gold mx-1">–</span>{closeTime}
        </div>
        <div className="text-xs text-ink-soft italic mt-0.5">{note}</div>
      </div>
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
    <section id="hours" className="section-pad bg-gradient-to-b from-cream-50 to-cream-100">
      <div className="container-brand max-w-3xl text-center">
        <span className="heading-eyebrow">HOURS</span>
        <h2 className="font-ar-display text-3xl font-bold text-gold-deep mt-1">ساعات العمل</h2>
        <span className="divider-gold" />

        <div className="grid gap-4 mt-8 md:grid-cols-2 max-w-xl mx-auto">
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

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <span className="text-xs font-medium px-4 py-1.5 rounded-full bg-amber-100/50 text-warning border border-amber-200/50">
            ⚠ يُمنع اصطحاب الأطفال
          </span>
          <span className="text-xs font-medium px-4 py-1.5 rounded-full bg-gold-light/10 text-gold-deep border border-gold-light/30">
            ✦ نعمل ٧ أيام في الأسبوع
          </span>
        </div>
      </div>
    </section>
  );
}
