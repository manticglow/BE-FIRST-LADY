/**
 * AnimatedCheck — علامة صح ترسم نفسها
 * الاستخدام: <AnimatedCheck size={64} />
 */
interface Props {
  size?: number;
  color?: string;
  bgColor?: string;
  className?: string;
}

export default function AnimatedCheck({
  size = 64, color = '#059669', bgColor = '#d1fae5', className = '',
}: Props) {
  return (
    <svg
      className={`check-draw ${className}`}
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="30"
        cy="30"
        r="27"
        stroke={color}
        strokeWidth="3"
        fill={bgColor}
      />
      <path
        d="M18 31 L26 39 L42 23"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
