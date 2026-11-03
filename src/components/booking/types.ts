/**
 * Shared types for BookingWizard + its steps.
 */
import type { Category, Service, Package, Profile } from '@/types/database';

export type Step = 1 | 2 | 3 | 4;

export interface BookingState {
  selectedServices: string[];     // service ids
  selectedPackageId: string | null;
  booking_date: string;
  booking_time: string;
  customer_name: string;    // اسم المستقبِلة (أو الحاجزة لو حجز عادي)
  customer_phone: string;   // جوال المستقبِلة
  customer_notes: string;
  // الهدية
  is_gift: boolean;
  gift_from_name: string;
  gift_from_phone: string;
  gift_message: string;
  // الكوبون
  coupon_code: string;
  coupon_discount: number;
  // بطاقة الهدية
  gift_card_code: string;
  gift_card_amount: number;
  // الاختصاصية
  staff_id: string | null;
  // نقاط الولاء
  loyalty_discount: number;
  loyalty_points_used: number;
}

export interface WizardCommonProps {
  categories: Category[];
  services: Service[];
  packages: Package[];
  user: Profile | null;
}

export type StateUpdater = (s: BookingState) => BookingState;
export type SetBookingState = (updater: StateUpdater | BookingState) => void;

// أيقونات التصنيفات حسب slug · من /public/images/icons/
export const CATEGORY_ICONS: Record<string, string> = {
  'massage':    '/images/icons/massage.png',
  'bath':       '/images/icons/bath.png',
  'facial':     '/images/icons/facial.png',
  'nails':      '/images/icons/nails.png',
  'brows':      '/images/icons/facial.png',
  'hair-color': '/images/icons/hair-color.png',
  'hair-cut':   '/images/icons/hair-cut.png',
  'blow-dry':   '/images/icons/blow-dry.png',
  'hair-style': '/images/icons/hair-style.png',
  'hair-treat': '/images/icons/hair-treat.png',
  'makeup':     '/images/icons/facial.png',
};
