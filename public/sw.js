/**
 * Service Worker — Be First Lady PWA
 * ═══════════════════════════════════════════════════════════
 * - كاش الأصول الأساسية للعمل بدون نت
 * - صفحة offline fallback
 * - تحديث تلقائي
 */

const CACHE_VERSION = 'bfl-v1';
const CACHE_RUNTIME = `${CACHE_VERSION}-runtime`;

// الأصول الأساسية (تُحمَّل مرة واحدة عند التثبيت)
const CORE_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/images/logo.svg',
  '/images/logo-white.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// التثبيت
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .catch(() => {})
  );
  self.skipWaiting();
});

// التفعيل — تنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION) && !k.startsWith(CACHE_RUNTIME))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// الاعتراض — استراتيجية ذكية حسب نوع الطلب
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // تجاهل طلبات غير GET
  if (request.method !== 'GET') return;

  // تجاهل Supabase و APIs (نحتاج real-time)
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return;
  }

  // تجاهل Chrome extensions
  if (url.protocol === 'chrome-extension:') return;

  // الصور والأيقونات → cache-first
  if (/\.(png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // CSS و JS → stale-while-revalidate
  if (/\.(css|js|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // الصفحات → network-first مع fallback
  event.respondWith(networkFirst(request));
});

// cache-first — للأصول الثابتة
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match('/offline');
  }
}

// stale-while-revalidate — للـ CSS و JS
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open(CACHE_RUNTIME).then((cache) => cache.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

// network-first — للصفحات
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_RUNTIME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline') || new Response('غير متصل', { status: 503 });
  }
}

// استقبال الإشعارات Push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Be First Lady', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Be First Lady', {
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      lang: 'ar',
      dir: 'rtl',
      vibrate: [100, 50, 100],
      data: payload.data || {},
      actions: payload.actions || [],
    })
  );
});

// النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
