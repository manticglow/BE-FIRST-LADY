/**
 * BannerCard — بطاقة عرض بالـcarousel الأعلى
 * - fallback ذكي للصور
 * - تدرّج ذهبي فاخر عند فشل كل الصور
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface Banner {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  fallback?: string;
  gradient?: string;
}

export default function BannerCard({ banner: b }: { banner: Banner }) {
  const [imgSrc, setImgSrc] = useState<string>(b.image);
  const [imgError, setImgError] = useState(false);

  function handleError() {
    if (imgSrc === b.image && b.fallback) {
      setImgSrc(b.fallback);
    } else {
      setImgError(true);
    }
  }

  return (
    <Link
      href={b.href}
      className="flex-shrink-0 w-full snap-center block relative aspect-[16/10] rounded-[24px] overflow-hidden shadow-gold-soft group"
    >
      {!imgError ? (
        <Image
          src={imgSrc}
          alt={b.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={handleError}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gold via-gold-deep to-ink">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                `radial-gradient(circle at 20% 30%, rgba(201,169,110,0.5) 0%, transparent 50%),` +
                `radial-gradient(circle at 80% 70%, rgba(232,207,197,0.2) 0%, transparent 50%)`,
            }}
          />
        </div>
      )}

      {/* طبقة تدرّج ناعمة من الأسفل */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light mb-1.5 opacity-90">
          SIGNATURE
        </div>
        <h3 className="font-en-display text-[22px] italic font-medium text-white leading-tight tracking-tight mb-1.5 drop-shadow-md">
          {b.title}
        </h3>
        <p className="text-[11px] text-cream-50/90 mb-3 drop-shadow leading-relaxed">
          {b.subtitle}
        </p>
        <div className="self-start inline-flex items-center gap-1.5 bg-white text-ink text-[11px] font-semibold px-3.5 py-2 rounded-full shadow-lg">
          احجزي الآن
          <span className="text-gold-deep">←</span>
        </div>
      </div>
    </Link>
  );
}
