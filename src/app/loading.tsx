/**
 * Global Loading — شاشة تحميل فاخرة
 * ═══════════════════════════════════════════════════════════
 * تظهر تلقائياً عند تحميل أي صفحة server component
 */
export default function Loading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* دائرة تدور */}
          <div className="absolute inset-0 border-4 border-cream-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-gold-deep rounded-full animate-spin" />
          {/* نقطة في الوسط */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🌸</span>
          </div>
        </div>
        <div className="font-en-display italic text-2xl text-gold-deep mb-2">
          Be First Lady
        </div>
        <p className="text-xs text-ink-soft">لحظة من فضلكِ...</p>
      </div>
    </main>
  );
}
