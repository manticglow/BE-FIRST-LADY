'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowDown } from 'lucide-react';
import { waLink } from '@/lib/utils';

export default function HeroSection() {
  return (
    <section id="top" className="relative min-h-[85vh] flex items-center justify-center text-center overflow-hidden">
      {/* زخارف الخلفية */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 opacity-10">
          <Image src="/images/lotus-decoration.svg" alt="" width={128} height={128} />
        </div>
        <div className="absolute bottom-10 right-10 w-40 h-40 opacity-10">
          <Image src="/images/lotus-decoration.svg" alt="" width={160} height={160} />
        </div>
      </div>

      <div className="container-brand relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* الشعار */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src="/images/logo.svg"
              alt="Be First Lady"
              width={180}
              height={180}
              priority
              className="drop-shadow-xl"
            />
          </motion.div>

          {/* SPA & SALON */}
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="font-en-label text-xs tracking-[0.4em] text-gold-light mt-8"
          >
            SPA & SALON
          </motion.span>

          {/* الاسم بالإنجليزي */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="font-en-display italic text-5xl md:text-7xl text-gold-deep mt-3"
          >
            Be First Lady
          </motion.h1>

          {/* فاصل ذهبي */}
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="divider-gold w-24 my-6"
          />

          {/* الشعار العربي */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
            className="font-ar-display text-4xl md:text-6xl text-gold-deep leading-tight"
          >
            نعتني بكِ لتُزهري
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="font-en-display italic text-lg text-gold mt-3"
          >
            A Sanctuary for You to Bloom
          </motion.p>

          {/* الوصف */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="text-ink-soft mt-6 max-w-xl text-base md:text-lg leading-relaxed"
          >
            مركزٌ نسائيٌّ متكاملٌ في قلب المدينة المنوّرة —<br />
            ترفٌ يليق بكِ، وجمالٌ يُحكى عنه.
          </motion.p>

          {/* الأزرار */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-10"
          >
            <a href={waLink('السلام عليكم، أرغب بحجز موعد')} target="_blank" rel="noopener" className="btn-primary">
              <MessageCircle className="w-5 h-5" />
              <span>احجزي موعدك</span>
            </a>
            <Link href="#services" className="btn-outline">
              <span>تصفّحي الخدمات</span>
              <ArrowDown className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* سهم للأسفل */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gold-light"
      >
        <ArrowDown className="w-5 h-5" />
      </motion.div>
    </section>
  );
}
