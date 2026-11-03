/**
 * FirstLoadSplash — شاشة ترحيب فاخرة · تظهر مرّة واحدة عند أوّل دخول
 * ═══════════════════════════════════════════════════════════
 * - تظهر مرّة واحدة لكل جلسة (sessionStorage)
 * - شعار كبير + إطار ذهبي + تدرّج ناعم
 * - ~2.5 ثانية ثم تختفي بسلاسة
 */
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const SPLASH_KEY = 'bfl_first_splash_seen';

export default function FirstLoadSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // تحقّقي إذا شافتها قبل في نفس الجلسة
    try {
      const seen = sessionStorage.getItem(SPLASH_KEY);
      if (seen) return;
    } catch { /* private window */ }

    setShow(true);

    // إخفاء بعد 2.3 ثانية
    const hideTimer = setTimeout(() => {
      setShow(false);
      try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch { /* ignore */ }
    }, 2300);

    return () => clearTimeout(hideTimer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-cream-50 flex items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          {/* ═══ زخارف خلفيّة ═══ */}
          <div className="absolute inset-0 pointer-events-none">
            {/* بتلة ذهبيّة كبيرة · علوية يمين */}
            <motion.div
              initial={{ opacity: 0, rotate: -10, scale: 0.9 }}
              animate={{ opacity: 0.15, rotate: 0, scale: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute top-10 right-10"
            >
              <Image src="/images/lotus-decoration.svg" alt="" width={200} height={200} />
            </motion.div>
            {/* بتلة ذهبيّة · سفلية يسار */}
            <motion.div
              initial={{ opacity: 0, rotate: 10, scale: 0.9 }}
              animate={{ opacity: 0.12, rotate: 0, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.2, ease: 'easeOut' }}
              className="absolute bottom-10 left-10"
            >
              <Image src="/images/lotus-decoration.svg" alt="" width={260} height={260} />
            </motion.div>

            {/* توهّج ذهبي في المنتصف */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-gold-light/20 to-amber-200/15 blur-3xl" />
          </div>

          {/* ═══ المحتوى الرئيسي ═══ */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* ─── الإطار الذهبي · الزوايا الأربع ─── */}
            <motion.div
              initial={{ width: 0, height: 0 }}
              animate={{ width: 50, height: 50 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="absolute -top-5 -left-5 border-t-2 border-l-2 border-gold-deep"
            />
            <motion.div
              initial={{ width: 0, height: 0 }}
              animate={{ width: 50, height: 50 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="absolute -top-5 -right-5 border-t-2 border-r-2 border-gold-deep"
            />
            <motion.div
              initial={{ width: 0, height: 0 }}
              animate={{ width: 50, height: 50 }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              className="absolute -bottom-5 -left-5 border-b-2 border-l-2 border-gold-deep"
            />
            <motion.div
              initial={{ width: 0, height: 0 }}
              animate={{ width: 50, height: 50 }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              className="absolute -bottom-5 -right-5 border-b-2 border-r-2 border-gold-deep"
            />

            {/* ─── المحتوى الداخلي ─── */}
            <div className="px-10 py-8 text-center">
              {/* اللوقو · كبير */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* هالة خلف اللوقو */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-light/30 to-amber-300/20 blur-2xl" />
                <Image
                  src="/images/logo.svg"
                  alt="Be First Lady"
                  width={140}
                  height={140}
                  priority
                  className="relative mx-auto drop-shadow-lg"
                />
              </motion.div>

              {/* SPA & SALON eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="font-en-label text-[10px] tracking-[0.5em] text-gold-light mt-6"
              >
                SPA & SALON
              </motion.div>

              {/* الاسم الفاخر */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="font-en-display italic text-3xl text-gold-deep mt-2"
              >
                Be First Lady
              </motion.div>

              {/* فاصل ذهبي متحرّك */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 1.4 }}
                className="w-16 h-px bg-gradient-to-r from-transparent via-gold-deep to-transparent mx-auto my-3 origin-center"
              />

              {/* العربي */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                className="font-ar-display text-base text-ink-soft"
              >
                نعتني بكِ لتُزهري
              </motion.div>

              {/* شريط التقدّم */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.8 }}
                className="mt-5 w-28 h-0.5 bg-cream-200 mx-auto overflow-hidden rounded-full"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 0.5, delay: 1.85, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-l from-gold-deep via-gold to-gold-light"
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
