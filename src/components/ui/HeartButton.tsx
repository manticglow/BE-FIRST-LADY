/**
 * HeartButton — زر القلب للمفضّلات
 * ═══════════════════════════════════════════════════════════
 * - يظهر فقط للعميلات المسجّلات
 * - يتطلّب تسجيل دخول · يوجّه لصفحة الدخول إذا ضغطت ضيفة
 * - أنيميشن نبض عند الإضافة
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useFavorites } from '@/hooks/useFavorites';

interface Props {
  serviceId?: string;
  staffId?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'ghost';
  className?: string;
}

export default function HeartButton({
  serviceId, staffId, size = 'md', variant = 'ghost', className = '',
}: Props) {
  const fav = useFavorites();
  const router = useRouter();
  const [pulsing, setPulsing] = useState(false);

  if (serviceId && staffId) {
    console.warn('HeartButton: pass either serviceId OR staffId, not both');
  }
  if (!serviceId && !staffId) return null;

  const isFav = serviceId ? fav.isService(serviceId) : fav.isStaff(staffId!);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size];

  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!fav.loggedIn) {
      toast.error('سجّلي دخولكِ لحفظ المفضّلات', { icon: '🔒' });
      setTimeout(() => router.push('/login?redirect=/'), 600);
      return;
    }

    setPulsing(true);
    const added = serviceId
      ? await fav.toggleService(serviceId)
      : await fav.toggleStaff(staffId!);

    if (added) {
      toast.success('أُضيفت لمفضّلتكِ 💛');
    } else {
      toast('تم الإزالة من المفضّلات');
    }

    setTimeout(() => setPulsing(false), 400);
  }

  const base = variant === 'solid'
    ? 'bg-white/90 backdrop-blur shadow-sm hover:bg-white'
    : 'bg-transparent hover:bg-white/80';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFav ? 'إزالة من المفضّلات' : 'أضيفي للمفضّلات'}
      className={`${sizeClasses} ${base} rounded-full flex items-center justify-center transition-all active:scale-90 ${
        pulsing ? 'scale-125' : ''
      } ${className}`}
    >
      <Heart
        className={`${iconSize} transition-colors ${
          isFav ? 'fill-rose-500 text-rose-500' : 'text-ink-soft hover:text-rose-500'
        }`}
      />
    </button>
  );
}
