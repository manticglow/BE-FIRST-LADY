/**
 * 404 Page — صفحة غير موجودة
 */
import Link from 'next/link';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gold-light/20">
        {/* 404 كبير وأنيق */}
        <div className="relative mb-6">
          <div className="font-en-display italic text-7xl md:text-8xl font-bold bg-gradient-to-br from-gold-deep to-gold-light bg-clip-text text-transparent">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass className="w-10 h-10 text-gold-deep opacity-30" />
          </div>
        </div>

        <h1 className="font-ar-display text-2xl font-bold text-gold-deep mb-2">
          الصفحة غير موجودة
        </h1>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">
          الرابط اللي تبحثين عنه غير متوفّر · ربّما تم نقله أو حذفه
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
          <Link
            href="/services"
            className="flex-1 bg-cream-50 text-gold-deep border border-gold-light/40 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-light/10 transition-colors"
          >
            <Search className="w-4 h-4" />
            تصفّحي الخدمات
          </Link>
        </div>
      </div>
    </main>
  );
}
