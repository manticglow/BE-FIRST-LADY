/**
 * Database Types · Be First Lady
 * ═══════════════════════════════════════════════════════════
 * Hand-crafted types for the project tables (derived from
 * supabase/migrations/*.sql).
 *
 * To regenerate from the live DB after schema changes:
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/database.ts
 *
 * Until then, update this file manually when migrations change.
 */

export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[];

// ─── Enums ───────────────────────────────────────────────────
export type UserRole = 'customer' | 'staff' | 'manager' | 'owner';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mada' | 'applepay' | 'stc';
export type PaymentGateway = 'moyasar' | 'tabby' | 'tamara' | 'manual';
export type BookingSource = 'website' | 'whatsapp' | 'walk-in' | 'phone';
export type SalonSection = 'spa' | 'salon';
export type DiscountType = 'percentage' | 'fixed' | 'package';
export type ReviewSource = 'internal' | 'google' | 'instagram';

// ─── Core domain rows ────────────────────────────────────────
export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  birthday: string | null;
  notes: string | null;
  beauty_profile?: Json;
  loyalty_points?: number;
  preferences?: Json;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  icon: string | null;
  color: string | null;
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
  created_at: string;
}

export interface Staff {
  id: string;
  profile_id: string | null;
  name: string;
  job_title: string;
  specialties: string[] | null;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
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
  source: BookingSource;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  service_id: string | null;
  service_name: string;
  price: number;
  duration_min: number;
  quantity: number;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway: PaymentGateway | null;
  gateway_ref: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
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
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string | null;
  customer_name: string;
  rating: number;
  comment: string | null;
  source: ReviewSource;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export interface Hours {
  id: string;
  section: SalonSection;
  day_of_week: number | null;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  special_date: string | null;
  note: string | null;
  created_at: string;
}

export interface Offer {
  id: string;
  slug: string;
  title_ar: string;
  subtitle_ar: string | null;
  description_ar: string | null;
  discount_type: DiscountType;
  discount_value: number;
  valid_from: string;
  valid_until: string;
  banner_image: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Json;
  ip_address: string | null;
  created_at: string;
}

// ─── Phase 2 tables ──────────────────────────────────────────
export interface StaffSchedule {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_off: boolean;
  created_at: string;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  profile_id: string;
  points: number;
  reason: string;
  booking_id: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_amount: number | null;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface GiftCard {
  id: string;
  code: string;
  amount: number;
  balance: number;
  sender_name: string | null;
  sender_phone: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string | null;
  message: string | null;
  design: string | null;
  status: 'active' | 'redeemed' | 'expired' | 'cancelled';
  expires_at: string | null;
  redeemed_at: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  location_id: string | null;
  check_in: string;
  check_out: string | null;
  break_minutes: number;
  notes: string | null;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  staff_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name_ar: string;
  name_en: string | null;
  category: string | null;
  quantity: number;
  min_quantity: number;
  unit: string;
  cost: number;
  is_active: boolean;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: Json;
  user_agent: string | null;
  created_at: string;
}

// ─── Joined / view-level rows ────────────────────────────────
export type BookingWithItems = Booking & {
  booking_items: BookingItem[];
  staff: Pick<Staff, 'id' | 'name' | 'avatar_url'> | null;
};

export type ServiceWithCategory = Service & {
  categories: Pick<Category, 'id' | 'slug' | 'name_ar' | 'name_en' | 'color' | 'icon'> | null;
};

// ─── Helpers ─────────────────────────────────────────────────
/** Insert = all fields except auto-generated ones */
export type Insert<T> = Omit<T, 'id' | 'created_at' | 'updated_at'> & { id?: string };

/** Update = everything optional */
export type Update<T> = Partial<Omit<T, 'id' | 'created_at'>>;

/** Supabase Database shape — compatible with createClient<Database>() */
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Insert<Profile>; Update: Update<Profile> };
      categories: { Row: Category; Insert: Insert<Category>; Update: Update<Category> };
      services: { Row: Service; Insert: Insert<Service>; Update: Update<Service> };
      packages: { Row: Package; Insert: Insert<Package>; Update: Update<Package> };
      staff: { Row: Staff; Insert: Insert<Staff>; Update: Update<Staff> };
      bookings: { Row: Booking; Insert: Insert<Booking>; Update: Update<Booking> };
      booking_items: { Row: BookingItem; Insert: Insert<BookingItem>; Update: Update<BookingItem> };
      payments: { Row: Payment; Insert: Insert<Payment>; Update: Update<Payment> };
      gallery: { Row: GalleryItem; Insert: Insert<GalleryItem>; Update: Update<GalleryItem> };
      reviews: { Row: Review; Insert: Insert<Review>; Update: Update<Review> };
      hours: { Row: Hours; Insert: Insert<Hours>; Update: Update<Hours> };
      offers: { Row: Offer; Insert: Insert<Offer>; Update: Update<Offer> };
      audit_log: { Row: AuditLog; Insert: Insert<AuditLog>; Update: Update<AuditLog> };
      staff_schedule: { Row: StaffSchedule; Insert: Insert<StaffSchedule>; Update: Update<StaffSchedule> };
      blocked_dates: { Row: BlockedDate; Insert: Insert<BlockedDate>; Update: Update<BlockedDate> };
      loyalty_transactions: { Row: LoyaltyTransaction; Insert: Insert<LoyaltyTransaction>; Update: Update<LoyaltyTransaction> };
      coupons: { Row: Coupon; Insert: Insert<Coupon>; Update: Update<Coupon> };
      gift_cards: { Row: GiftCard; Insert: Insert<GiftCard>; Update: Update<GiftCard> };
      attendance_records: { Row: AttendanceRecord; Insert: Insert<AttendanceRecord>; Update: Update<AttendanceRecord> };
      leave_requests: { Row: LeaveRequest; Insert: Insert<LeaveRequest>; Update: Update<LeaveRequest> };
      inventory_items: { Row: InventoryItem; Insert: Insert<InventoryItem>; Update: Update<InventoryItem> };
      push_subscriptions: { Row: PushSubscription; Insert: Insert<PushSubscription>; Update: Update<PushSubscription> };
    };
  };
};
