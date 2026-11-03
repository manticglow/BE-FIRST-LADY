/**
 * StepServices — خطوة اختيار الخدمات والبكجات
 * ═══════════════════════════════════════════════════════════
 * - يعرض البكجات أولاً
 * - شبكة تصنيفات → عند النقر: يفتح الخدمات داخل التصنيف
 * - يدعم اختيار خدمات من أكثر من تصنيف
 */
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Check, ChevronLeft, Clock, Sparkles } from 'lucide-react';
import type { Category, Service, Package } from '@/types/database';
import { formatPrice, formatDuration } from '@/lib/utils';
import { CATEGORY_ICONS, type BookingState } from '../types';
import SummaryStrip from './SummaryStrip';

interface Props {
  categories: Category[];
  services: Service[];
  packages: Package[];
  state: BookingState;
  toggleService: (id: string) => void;
  choosePackage: (id: string) => void;
  subtotal: number;
  duration: number;
}

export default function StepServices({
  categories, services, packages, state, toggleService, choosePackage, subtotal, duration,
}: Props) {
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const activeCatObj = activeCat ? categories.find((c) => c.id === activeCat) : null;
  const activeServices = activeCat ? services.filter((s) => s.category_id === activeCat) : [];

  const countByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    services.forEach((s) => {
      m[s.category_id] = (m[s.category_id] || 0) + 1;
    });
    return m;
  }, [services]);

  const availableCategories = categories.filter((c) => (countByCategory[c.id] || 0) > 0);

  return (
    <div>
      {/* ═══ البكجات · دائماً مرئيّة ═══ */}
      {packages.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-gold-deep" />
            <h3 className="font-ar-display text-lg font-bold text-gold-deep">
              البكجات الجاهزة
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              وفّري أكثر
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {packages.map((p) => {
              const sel = state.selectedPackageId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => choosePackage(p.id)}
                  className={`text-right border-2 rounded-2xl p-4 transition-all ${
                    sel
                      ? 'border-gold-deep bg-gradient-to-br from-gold-light/15 to-amber-50 shadow-md'
                      : 'border-cream-200 bg-white hover:border-gold-light hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-ar-display font-bold text-ink">{p.name_ar}</div>
                    {sel && <Check className="w-5 h-5 text-gold-deep shrink-0" />}
                  </div>
                  {p.description_ar && (
                    <p className="text-xs text-ink-soft mb-3 line-clamp-2">{p.description_ar}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-cream-100">
                    <span className="font-en-display font-bold text-gold-deep text-lg">
                      {formatPrice(p.price)}
                    </span>
                    {p.original_price && Number(p.original_price) > Number(p.price) && (
                      <span className="text-xs text-ink-soft line-through font-en-display">
                        {formatPrice(p.original_price)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ عرض شبكة التصنيفات ═══ */}
      {!activeCat && (
        <div>
          <div className="mb-5">
            <h2 className="font-ar-display text-2xl font-bold text-gold-deep mb-1">
              اختاري تصنيفاً
            </h2>
            <p className="text-sm text-ink-soft">
              تصفّحي خدماتنا حسب التصنيف · واختاري ما يناسبكِ
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableCategories.map((cat) => {
              const selectedCount = services.filter(
                (s) => s.category_id === cat.id && state.selectedServices.includes(s.id)
              ).length;
              const total = countByCategory[cat.id];
              const iconSrc = CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS['facial'];

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`group relative text-right rounded-2xl p-4 transition-all overflow-hidden ${
                    selectedCount > 0
                      ? 'bg-gradient-to-br from-gold-light/15 to-amber-50 border-2 border-gold-deep shadow-md'
                      : 'bg-white border-2 border-cream-200 hover:border-gold-light hover:shadow-md'
                  }`}
                >
                  <div className="absolute top-0 left-0 w-20 h-20 bg-gold-light/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  {selectedCount > 0 && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gradient-to-br from-gold-deep to-ink text-cream-50 flex items-center justify-center text-[11px] font-bold shadow-md">
                      {selectedCount}
                    </div>
                  )}

                  <div className="relative w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-cream-100 to-cream-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Image src={iconSrc} alt="" width={36} height={36} className="object-contain" />
                  </div>

                  <div className="text-center">
                    <div className="font-ar-display font-bold text-sm text-ink mb-0.5">
                      {cat.name_ar}
                    </div>
                    <div className="text-[10px] text-ink-soft">
                      {total} خدم{total === 1 ? 'ة' : total === 2 ? 'تين' : total > 10 ? 'ة' : 'ات'}
                    </div>
                  </div>

                  <ChevronLeft className="absolute bottom-3 left-3 w-4 h-4 text-gold-light opacity-40 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>

          <div className="mt-6 bg-cream-50 border border-cream-200 rounded-xl p-3 flex items-center gap-2 text-[11px] text-ink-soft">
            <Sparkles className="w-3.5 h-3.5 text-gold-light shrink-0" />
            <span>تقدرين تختارين خدمات من <strong>أكثر من تصنيف</strong> · كل الاختيارات تتجمّع في الحجز</span>
          </div>
        </div>
      )}

      {/* ═══ عرض خدمات التصنيف ═══ */}
      {activeCat && activeCatObj && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setActiveCat(null)}
              className="group flex items-center gap-1.5 text-sm text-ink-soft hover:text-gold-deep transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              <span>كل التصنيفات</span>
            </button>
            {state.selectedServices.length > 0 && (
              <span className="text-[11px] text-gold-deep font-bold bg-gold-light/15 px-3 py-1 rounded-full">
                {state.selectedServices.length} مُحدّدة من جميع التصنيفات
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-cream-200">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-light/20 to-amber-100/50 flex items-center justify-center shrink-0">
              <Image
                src={CATEGORY_ICONS[activeCatObj.slug] || CATEGORY_ICONS['facial']}
                alt=""
                width={28}
                height={28}
              />
            </div>
            <div>
              <h2 className="font-ar-display text-xl font-bold text-ink">
                {activeCatObj.name_ar}
              </h2>
              {activeCatObj.description_ar && (
                <p className="text-xs text-ink-soft mt-0.5">{activeCatObj.description_ar}</p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2.5">
            {activeServices.map((s) => {
              const sel = state.selectedServices.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`relative text-right border-2 rounded-2xl p-3.5 transition-all ${
                    sel
                      ? 'border-gold-deep bg-gradient-to-br from-gold-light/15 to-amber-50 shadow-md'
                      : 'border-cream-200 bg-white hover:border-gold-light hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-ink mb-1">{s.name_ar}</div>
                      {s.description_ar && (
                        <p className="text-[11px] text-ink-soft line-clamp-2 mb-2 leading-relaxed">
                          {s.description_ar}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-ink-soft">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gold-light" />
                          <span className="font-en-display">{formatDuration(s.duration_min)}</span>
                        </span>
                        {s.is_featured && (
                          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                            <Sparkles className="w-2.5 h-2.5" />
                            مميّزة
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-left shrink-0 flex flex-col items-end gap-1">
                      <div className="font-en-display font-bold text-base text-gold-deep">
                        {s.price_from && (
                          <span className="text-[10px] font-normal text-ink-soft ml-1">من</span>
                        )}
                        {formatPrice(s.price, { showFrom: false })}
                      </div>
                      {sel ? (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-deep to-ink text-cream-50 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-cream-300" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setActiveCat(null)}
            className="mt-5 w-full py-3 border-2 border-dashed border-cream-300 text-ink-soft rounded-xl hover:border-gold-light hover:text-gold-deep transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            اختاري من تصنيف آخر
          </button>
        </div>
      )}

      {(state.selectedServices.length > 0 || state.selectedPackageId) && (
        <SummaryStrip subtotal={subtotal} duration={duration} count={state.selectedServices.length || 1} />
      )}
    </div>
  );
}
