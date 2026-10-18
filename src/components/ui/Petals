/**
 * Petals — بتلات ورد متساقطة ناعمة
 * ═══════════════════════════════════════════════════════════
 * - أنيميشن CSS نقي (لا JS، لا rerender)
 * - 5 بتلات بألوان ذهبية/ورديّة ناعمة
 * - تحترم prefers-reduced-motion
 * - تشتغل على الموبايل تلقائي · تشتغل عند hover على الديسكتوب
 *
 * الاستخدام:
 *   <div className="group relative">
 *     ...محتوى البطاقة
 *     <Petals />
 *   </div>
 */

export default function Petals({ count = 5 }: { count?: number }) {
  return (
    <div className="petals-layer" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Petal key={i} index={i + 1} />
      ))}
    </div>
  );
}

function Petal({ index }: { index: number }) {
  // ألوان متدرّجة ناعمة · ذهبي → ورديّ
  const colors = [
    '#e8c89a', // ذهبي ناعم
    '#f0d4b2', // بيج ذهبي
    '#e8bca8', // ورديّ ذهبي
    '#f5d9c4', // خوخي ناعم
    '#dfb589', // ذهبي عميق
  ];
  const color = colors[(index - 1) % colors.length];

  return (
    <svg
      className={`petal petal-${index}`}
      viewBox="0 0 20 20"
      fill={color}
    >
      {/* شكل بتلة ورد ناعم */}
      <path
        d="M10 2 C 14 2, 17 6, 17 10 C 17 14, 14 18, 10 18 C 6 18, 3 14, 3 10 C 3 6, 6 2, 10 2 Z"
        transform="rotate(45 10 10)"
        opacity="0.9"
      />
      <path
        d="M10 4 C 13 4, 15 7, 15 10 C 15 13, 13 16, 10 16 C 7 16, 5 13, 5 10 C 5 7, 7 4, 10 4 Z"
        fill="rgba(255,255,255,0.2)"
        transform="rotate(45 10 10)"
      />
    </svg>
  );
}
