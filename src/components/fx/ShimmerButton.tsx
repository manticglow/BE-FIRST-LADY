/**
 * ShimmerButton — زر فيه شيمر ذهبي يمرّ عند الـhover
 *
 * الاستخدام:
 *   <ShimmerButton as="a" href="/booking">احجزي الآن</ShimmerButton>
 *   <ShimmerButton onClick={fn}>تابعي</ShimmerButton>
 *
 * ملاحظة: ما يحلّ محل كل الأزرار · فقط للـprimary CTAs
 */
import { type ReactNode, type ElementType } from 'react';

interface Props {
  children: ReactNode;
  as?: ElementType;
  halo?: boolean;        // هالة نابضة (استخدم للـCTA الأهم فقط)
  className?: string;
  [key: string]: any;
}

export default function ShimmerButton({
  children, as: Tag = 'button', halo = false, className = '', ...rest
}: Props) {
  return (
    <Tag
      className={`btn-shimmer ${halo ? 'btn-halo' : ''} ${className}`}
      {...rest}
    >
      <span style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </span>
    </Tag>
  );
}
