/**
 * LoaderScreen — شاشة التحميل الفاخرة
 * ═══════════════════════════════════════════════════════════
 * - تظهر مرة واحدة عند أول زيارة في الجلسة
 * - مدة ~4.5 ثانية بتأثيرات رسم إطار + شريط تقدّم
 * - تختفي بتدرّج ناعم
 */
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function LoaderScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // تحقق إذا شافت الشاشة قبل في نفس الجلسة
    const seen = sessionStorage.getItem('bfl_loader_seen');
    if (seen) {
      setShow(false);
      return;
    }

    const timer = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem('bfl_loader_seen', '1');
      } catch {}
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-cream-50 flex items-center justify-center overflow-hidden"
        >
          {/* زخارف خلفية */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-16 left-16 w-40 h-40">
              <Image src="/images/lotus-decoration.svg" alt="" width={160} height={160} />
            </div>
            <div className="absolute bottom-16 right-16 w-56 h-56">
              <Image src="/images/lotus-decoration.svg" alt="" width={224} height={224} />
            </div>
          </div>

          {/* الإطار الفاخر */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* زاوية علوية يسار */}
            <motion.div
              initial={{ width: 0, height: 0 }}
              animate={{ width: 60, height: 60 }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              className="absolute -top-6 -left-6 border-t-2 border-l-2 border-gold"
            />
            {/* زاوية علوية يمين */}
            <motion.div
              initial={{ width: 0, height: 0 }}
              animate={{ width: 60, height: 60 }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              className="absolute -top-6 -right-6 border-t-2 border-r-2 border-gold"
            />
            {/* زاوية سفلية يسار */}
            <motion.div
              initial={{ width: 0, height: 0 }}
              animate={{ width: 60, height: 60 }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
              className="absolute -bottom-6 -left-6 border-b-2 border-l-2 border-gold"
            />
            {/* زاوية سفلية يمين */}
            <motion.div
              initial={{ width: 0, height: 0 }}
              animate={{ width: 60, height: 60 }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
              className="absolute -bottom-6 -right-6 border-b-2 border-r-2 border-gold"
            />

            {/* المحتوى الداخلي */}
            <div className="px-10 py-8 text-center">
              {/* اللوقو */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.0, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src="/images/logo.svg"
                  alt="Be First Lady"
                  width={140}
                  height={140}
                  priority
                  className="mx-auto drop-shadow-lg"
                />
              </motion.div>

              {/* SPA & SALON */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="font-en-label text-[10px] tracking-[0.4em] text-gold mt-6"
              >
                SPA & SALON
              </motion.div>

              {/* الاسم */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.7 }}
                className="font-en-display italic text-3xl text-gold-deep mt-2"
              >
                Be First Lady
              </motion.div>

              {/* فاصل متحرّك */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 2.0 }}
                className="divider-gold w-20 mx-auto my-4 origin-center"
              />

              {/* الاسم العربي */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 2.4 }}
                className="font-ar-display text-xl text-gold-deep"
              >
                نعتني بكِ لتُزهري
              </motion.div>

              {/* شريط التقدّم */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 2.8 }}
                className="mt-6 w-32 h-0.5 bg-cream-200 mx-auto overflow-hidden rounded-full"
              >
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.3, delay: 2.9, ease: 'easeInOut' }}
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
