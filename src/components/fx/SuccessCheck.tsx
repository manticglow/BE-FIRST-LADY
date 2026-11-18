/**
 * SuccessCheck · ✓ عنصر رسومي يُرسم ديناميكياً
 * ═══════════════════════════════════════════════════════════
 * - دائرة تُرسم (0.6s)
 * - ثمّ علامة الصحّ تُرسم (0.5s delay 0.1s)
 * - استخدام: <SuccessCheck size={64} />
 */

export default function SuccessCheck({ size = 64, color = '#8b6f3f' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <circle
        cx="32" cy="32" r="28"
        fill="none"
        stroke={color}
        strokeWidth="3"
        className="circle-draw"
      />
      <path
        d="M20 32 L28 40 L44 24"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="check-draw"
      />
    </svg>
  );
}
