/**
 * InteractiveFx · مجموعة helpers للتأثيرات الحيويّة
 * ═══════════════════════════════════════════════════════════
 * - sparkleBurst(el)   · ينفجر 12 شرارة ذهبيّة من عنصر
 * - flyToCart(from, imgSrc) · يطير عنصر صغير نحو الـcart badge
 * - ripple(e)          · ripple ذهبي عند النقر (على الـbutton)
 * - heartbeat(el)      · ينبض العنصر لحظة
 * - welcomeGlow(el)    · glow يظهر ويختفي (للـoverlays)
 * - haptic()           · اهتزاز + fallback بصري على iOS
 */

/** ينفجر شرارات ذهبيّة من مركز العنصر */
export function sparkleBurst(el: HTMLElement | null, count: number = 10) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const host = document.createElement('div');
  host.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:9999;`;
  document.body.appendChild(host);

  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const distance = 40 + Math.random() * 30;
    const sx = Math.cos(angle) * distance;
    const sy = Math.sin(angle) * distance;
    s.style.cssText = `
      left: ${centerX}px;
      top: ${centerY}px;
      --sx: ${sx}px;
      --sy: ${sy}px;
      transform: translate(-50%, -50%);
    `;
    host.appendChild(s);
  }

  setTimeout(() => host.remove(), 1000);
}

/** عنصر "يطير" من نقطة البداية إلى زرّ السلّة الأعلى يمين */
export function flyToCart(fromEl: HTMLElement | null, imageSrc?: string) {
  if (!fromEl) return;
  const rect = fromEl.getBoundingClientRect();
  const cart = document.querySelector('[data-cart-badge]');
  const cartRect = cart?.getBoundingClientRect();
  const targetX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 40;
  const targetY = cartRect ? cartRect.top + cartRect.height / 2 : 40;

  const flyer = document.createElement('div');
  flyer.className = 'fly-to-cart';
  flyer.style.cssText = `
    left: ${rect.left + rect.width / 2 - 25}px;
    top: ${rect.top + rect.height / 2 - 25}px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: ${imageSrc ? `url(${imageSrc})` : 'radial-gradient(circle, #d4a860 0%, #8b6f3f 100%)'};
    background-size: cover;
    background-position: center;
    box-shadow: 0 8px 24px rgba(201, 169, 110, 0.5);
    border: 2px solid #fbf7ef;
    --fly-x: ${targetX - (rect.left + rect.width / 2)}px;
    --fly-y: ${targetY - (rect.top + rect.height / 2)}px;
  `;
  document.body.appendChild(flyer);
  setTimeout(() => {
    flyer.remove();
    // اهتزّ الـcart badge
    if (cart) cart.classList.add('heartbeat');
    setTimeout(() => cart?.classList.remove('heartbeat'), 1000);
  }, 800);
}

/** Ripple effect at click point · استدعيها من onClick */
export function clickRipple(e: React.MouseEvent<HTMLElement>) {
  const target = e.currentTarget as HTMLElement;
  if (!target.classList.contains('ripple-container')) {
    target.classList.add('ripple-container');
  }
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  target.appendChild(r);
  setTimeout(() => r.remove(), 700);
}

/** Heartbeat animation · على عنصر مرّة واحدة */
export function heartbeat(el: HTMLElement | null) {
  if (!el) return;
  el.classList.add('heartbeat');
  setTimeout(() => el.classList.remove('heartbeat'), 900);
}

/** اهتزاز الموبايل (مع fallback بصري على iOS) */
export function haptic(ms: number = 10, visualTarget?: HTMLElement) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  } catch { /* silent */ }

  // fallback بصري لـiOS (الذي لا يدعم vibrate)
  if (visualTarget) {
    heartbeat(visualTarget);
  }
}
