/**
 * صفحة offline — تظهر لمّا ما فيه نت
 */
import Image from 'next/image';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full text-center">
        <Image
          src="/images/logo.svg"
          alt="Be First Lady"
          width={100}
          height={100}
          className="mx-auto opacity-60"
        />

        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mt-6 mb-2">
          OFFLINE
        </div>

        <h1 className="font-ar-display text-2xl font-bold text-gold-deep mb-3">
          لا يوجد اتصال بالإنترنت
        </h1>

        <p className="text-sm text-ink-soft leading-relaxed mb-8">
          تحقّقي من اتصالكِ بالإنترنت وحاولي مرة أخرى.
          <br />
          <span className="text-xs opacity-70">الصفحات التي زرتِها مسبقاً متاحة.</span>
        </p>

        <Link
          href="/"
          className="btn-primary inline-block"
        >
          إعادة المحاولة
        </Link>
      </div>
    </main>
  );
}
