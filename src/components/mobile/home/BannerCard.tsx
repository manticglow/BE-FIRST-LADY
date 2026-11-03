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
      className="flex-shrink-0 w-full snap-center block relative aspect-[16/10] rounded-3xl overflow-hidden shadow-md"
    >
      {!imgError ? (
        <Image
          src={imgSrc}
          alt={b.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={handleError}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gold-deep via-ink to-gold-deep">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),` +
                `radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            }}
          />
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-tl ${b.gradient || 'from-ink/70 via-ink/30 to-transparent'}`} />

      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <div className="text-right">
          <h3 className="font-ar-display text-xl md:text-2xl font-bold text-cream-50 leading-tight drop-shadow-md">
            {b.title}
          </h3>
          <p className="text-xs text-cream-50/95 mt-1 drop-shadow">{b.subtitle}</p>
        </div>
        <div className="self-start bg-gold-light/90 backdrop-blur text-ink text-xs font-bold px-4 py-2 rounded-full shadow-lg">
          احجزي الآن
        </div>
      </div>
    </Link>
  );
}
