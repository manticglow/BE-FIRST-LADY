/**
 * LightRays — أشعّة ذهبيّة ناعمة من الزاوية
 * ضعيه داخل container نسبي (relative overflow-hidden)
 */
export default function LightRays({ className = '' }: { className?: string }) {
  return <div className={`light-rays ${className}`} aria-hidden="true" />;
}
