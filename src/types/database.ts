/**
 * ═══════════════════════════════════════════════════════════
 * Be First Lady — Database Types
 * ═══════════════════════════════════════════════════════════
 *
 * هذه الـ types مطابقة لـ schema قاعدة البيانات.
 * عادةً تُولَّد تلقائياً بـ: npm run db:types
 * (بعد ربط supabase CLI بالمشروع)
 */

export type UserRole = 'customer' | 'staff' | 'manager' | 'owner';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mada' | 'applepay' | 'stc';

// ═══════════════════════════════════════════════════════════
// Core Entities
// ═══════════════════════════════════════════════════════════

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  birthday: string | null;
  notes: string | null;
  loyalty_points?: number;
  loyalty_tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
  total_spent?: number;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_total: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  per_customer_limit: number;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  customer_id: string;
  booking_id: string | null;
  points: number;
  reason: string;
  balance_after: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  check_in_at: string;
  check_out_at: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  check_in_accuracy_m: number | null;
  check_out_accuracy_m: number | null;
  location_id: string | null;
  notes: string | null;
  is_late: boolean;
  total_minutes: number | null;
  created_at: string;
}

export interface SalonLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_m: number;
  is_active: boolean;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: 'annual' | 'sick' | 'emergency' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  icon: string | null;
  color: string;
  description_ar: string | null;
  description_en: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  price_from: boolean;
  duration_min: number;
  image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  notes_ar: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Package {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  price: number;
  original_price: number | null;
  cover_image_url: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  display_order: number;
  services?: Service[];
}

export interface Staff {
  id: string;
  profile_id: string | null;
  name: string;
  job_title: string;
  specialties: string[];
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  display_order: number;
  services?: Service[];
}

export interface Booking {
  id: string;
  booking_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  booking_date: string;
  booking_time: string;
  duration_min: number;
  staff_id: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  customer_notes: string | null;
  admin_notes: string | null;
  source: 'website' | 'whatsapp' | 'walk-in' | 'phone';
  cancellation_reason: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  // الهدية
  is_gift?: boolean;
  gift_from_name?: string | null;
  gift_from_phone?: string | null;
  gift_message?: string | null;
  invitation_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  items?: BookingItem[];
  staff?: Staff;
  customer?: Profile;
  payments?: Payment[];
}

export interface BookingItem {
  id: string;
  booking_id: string;
  service_id: string | null;
  service_name: string;
  price: number;
  duration_min: number;
  quantity: number;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway: string | null;
  gateway_ref: string | null;
  receipt_url: string | null;
  paid_at: string | null;
}

export interface GalleryItem {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  image_url: string;
  thumbnail_url: string | null;
  category_id: string | null;
  is_featured: boolean;
  display_order: number;
  is_published: boolean;
}

export interface Review {
  id: string;
  booking_id: string | null;
  customer_name: string;
  rating: number;
  comment: string | null;
  source: 'internal' | 'google' | 'instagram';
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface Offer {
  id: string;
  slug: string;
  title_ar: string;
  subtitle_ar: string | null;
  description_ar: string | null;
  discount_type: 'percentage' | 'fixed' | 'package' | null;
  discount_value: number | null;
  valid_from: string;
  valid_until: string;
  banner_image: string | null;
  is_active: boolean;
}

// ═══════════════════════════════════════════════════════════
// Supabase Database Shape (for type-safe queries)
// ═══════════════════════════════════════════════════════════
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      services: { Row: Service; Insert: Partial<Service>; Update: Partial<Service> };
      packages: { Row: Package; Insert: Partial<Package>; Update: Partial<Package> };
      staff: { Row: Staff; Insert: Partial<Staff>; Update: Partial<Staff> };
      bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> };
      booking_items: { Row: BookingItem; Insert: Partial<BookingItem>; Update: Partial<BookingItem> };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> };
      gallery: { Row: GalleryItem; Insert: Partial<GalleryItem>; Update: Partial<GalleryItem> };
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> };
      offers: { Row: Offer; Insert: Partial<Offer>; Update: Partial<Offer> };
    };
  };
}
