/**
 * Web App Manifest — تعريف التطبيق للـ PWA
 */
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Be First Lady · صالون السيدة الأولى',
    short_name: 'Be First Lady',
    description: 'سبا وصالون نسائي فاخر في المدينة المنوّرة — نعتني بكِ لتُزهري',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fbf7ef',
    theme_color: '#7d613b',
    lang: 'ar',
    dir: 'rtl',
    categories: ['beauty', 'lifestyle', 'health'],
    icons: [
      { src: '/icons/icon-72.png',   sizes: '72x72',   type: 'image/png' },
      { src: '/icons/icon-96.png',   sizes: '96x96',   type: 'image/png' },
      { src: '/icons/icon-128.png',  sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144.png',  sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152.png',  sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-167.png',  sizes: '167x167', type: 'image/png' },
      { src: '/icons/icon-180.png',  sizes: '180x180', type: 'image/png' },
      { src: '/icons/icon-192.png',  sizes: '192x192', type: 'image/png',  purpose: 'any' },
      { src: '/icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png',  purpose: 'maskable' },
      { src: '/icons/icon-384.png',  sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512.png',  sizes: '512x512', type: 'image/png',  purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png',  purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'احجزي الآن',
        short_name: 'حجز',
        description: 'احجزي موعداً جديداً',
        url: '/booking',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'حسابي',
        short_name: 'حسابي',
        description: 'عرض الحجوزات والنقاط',
        url: '/account',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
