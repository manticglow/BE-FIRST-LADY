/**
 * Shared types for StaffMobileApp + its tabs
 */

export interface StaffBookingItem {
  service_name: string;
  price: number;
  duration_min: number;
}

export interface StaffBooking {
  id: string;
  booking_number: string | null;
  booking_date: string;
  booking_time: string;
  duration_min: number;
  customer_name: string;
  customer_phone: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  payment_status: string;
  total: number;
  items?: StaffBookingItem[];
}

export interface StaffUser {
  userId: string;
  staffId: string | null;
  firstName: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface AttendanceState {
  isCheckedIn: boolean;
  checkInAt: string | null;
  workedMinutes: number;
  weekHours: number;
  weekDays: number;
}

export type TabKey = 'home' | 'bookings' | 'schedule' | 'requests' | 'profile';

export const STATUS_STYLES: Record<string, { label: string; dot: string; bg: string }> = {
  pending:     { label: 'بانتظار',   dot: 'bg-amber-500',  bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed:   { label: 'مؤكّد',      dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: 'جاري',      dot: 'bg-blue-500 animate-pulse', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed:   { label: 'مكتمل',     dot: 'bg-stone-500',   bg: 'bg-stone-50 text-stone-700 border-stone-200' },
  cancelled:   { label: 'ملغي',      dot: 'bg-rose-500',    bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  no_show:     { label: 'لم تحضر',   dot: 'bg-rose-500',    bg: 'bg-rose-50 text-rose-700 border-rose-200' },
};
