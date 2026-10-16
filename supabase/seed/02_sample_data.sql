-- ═══════════════════════════════════════════════════════════
-- 02 · Sample Data — بيانات تجريبيّة للاختبار
-- شغّليها بعد ما تنشئي حسابات الاختبار من scripts/create-test-users.ts
-- ═══════════════════════════════════════════════════════════

-- ─── نقاط ولاء للعميلة + طبقة ذهبيّة ───────────────────
UPDATE profiles
SET loyalty_points = 1840,
    loyalty_tier = 'gold',
    total_spent = 6840
WHERE email = 'customer@befirstlady.com';

-- ─── حجز قادم + حجز مؤكّد سابق للعميلة ────────────────
WITH cust AS (SELECT id FROM profiles WHERE email = 'customer@befirstlady.com'),
     staff_id AS (SELECT id FROM profiles WHERE email = 'staff@befirstlady.com'),
     svc AS (SELECT id, price FROM services WHERE name_ar = 'مساج ملكي' LIMIT 1)
INSERT INTO bookings (
  customer_id, customer_name, customer_phone,
  booking_date, booking_time, duration_min,
  subtotal, total, status, payment_status,
  source, staff_id, booking_number
)
SELECT
  (SELECT id FROM cust),
  'سارة الزهراني',
  '0504389329',
  CURRENT_DATE + INTERVAL '1 day',
  '17:00',
  90,
  350, 350,
  'confirmed', 'unpaid', 'website',
  (SELECT id FROM staff_id),
  'B-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001'
ON CONFLICT DO NOTHING;

-- ─── حجز سابق مكتمل ─────────────────────────────────
WITH cust AS (SELECT id FROM profiles WHERE email = 'customer@befirstlady.com'),
     staff_id AS (SELECT id FROM profiles WHERE email = 'staff@befirstlady.com')
INSERT INTO bookings (
  customer_id, customer_name, customer_phone,
  booking_date, booking_time, duration_min,
  subtotal, total, status, payment_status,
  source, staff_id, booking_number
)
SELECT
  (SELECT id FROM cust),
  'سارة الزهراني',
  '0504389329',
  CURRENT_DATE - INTERVAL '7 days',
  '15:30',
  75,
  280, 280,
  'completed', 'paid', 'website',
  (SELECT id FROM staff_id),
  'B-' || TO_CHAR(NOW() - INTERVAL '7 days', 'YYYYMMDD') || '-002'
ON CONFLICT DO NOTHING;

-- ─── إسناد الخدمات للموظّفة هديل ────────────────────
WITH staff_h AS (SELECT id FROM profiles WHERE email = 'staff@befirstlady.com')
INSERT INTO staff_services (staff_id, service_id)
SELECT (SELECT id FROM staff_h), s.id
FROM services s
WHERE s.name_ar IN (
  'مساج ملكي', 'مساج سويدي', 'مساج الحجر الساخن',
  'مساج ديب تيشو', 'حمّام مغربي كلاسيك', 'تقشير جسم كامل'
)
ON CONFLICT DO NOTHING;

-- ─── جدول عمل هديل (6 أيام في الأسبوع) ──────────────
WITH staff_h AS (SELECT id FROM profiles WHERE email = 'staff@befirstlady.com')
INSERT INTO staff_schedules (staff_id, day_of_week, start_time, end_time, is_working)
SELECT (SELECT id FROM staff_h), d, '09:00', '18:00', true
FROM generate_series(0, 5) d
ON CONFLICT DO NOTHING;

-- يوم إجازة ثابت (الاثنين = 1)
WITH staff_h AS (SELECT id FROM profiles WHERE email = 'staff@befirstlady.com')
INSERT INTO staff_schedules (staff_id, day_of_week, start_time, end_time, is_working)
SELECT (SELECT id FROM staff_h), 1, '09:00', '18:00', false
ON CONFLICT (staff_id, day_of_week) DO UPDATE SET is_working = false;

-- ─── بطاقة هديّة لتجربة العميلة ──────────────────────
INSERT INTO gift_cards (code, amount, balance, status, expires_at)
VALUES (
  'GC-TEST-2026',
  500,
  420,
  'active',
  CURRENT_DATE + INTERVAL '1 year'
)
ON CONFLICT (code) DO NOTHING;

-- ─── كوبون خصم للتجربة ───────────────────────────────
INSERT INTO coupons (code, discount_type, discount_value, min_total, max_uses, used_count, is_active, expires_at)
VALUES (
  'WELCOME20',
  'percentage',
  20,
  100,
  100,
  0,
  true,
  CURRENT_DATE + INTERVAL '3 months'
)
ON CONFLICT (code) DO NOTHING;

-- ─── بعض عناصر المخزون للتجربة ──────────────────────
INSERT INTO inventory_items (name_ar, sku, quantity, min_quantity, unit, cost_price, selling_price, is_active)
VALUES
  ('زيت الورد التركي', 'OIL-ROSE-TR', 0, 5, 'زجاجة', 85, 150, true),
  ('كريم تنظيف البشرة', 'CRM-FACE-01', 12, 3, 'عبوة', 45, 95, true),
  ('قناع الطين المغربي', 'MASK-CLAY-MA', 18, 5, 'عبوة', 25, 60, true),
  ('شموع عطريّة · لافندر', 'CAN-LAV-01', 2, 10, 'شمعة', 15, 35, true),
  ('مناشف فاخرة · بيضاء', 'TOWEL-WHT', 42, 20, 'منشفة', 25, 0, true)
ON CONFLICT DO NOTHING;

-- ─── 3 إشعارات للمالكة ───────────────────────────────
INSERT INTO notifications (user_id, title, body, type, is_read)
SELECT id, 'طلب إجازة جديد',
       'هديل القحطاني تطلب إجازة 3 أيام · 22-24 أكتوبر',
       'leave_request', false
FROM profiles WHERE role = 'owner'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, body, type, is_read)
SELECT id, 'نفذ المخزون',
       'زيت الورد التركي · آخر وحدة',
       'inventory_alert', false
FROM profiles WHERE role = 'owner'
ON CONFLICT DO NOTHING;

INSERT INTO notifications (user_id, title, body, type, is_read)
SELECT id, 'تقييم جديد ★★★★★',
       'سارة الزهراني · "تجربة فوق الممتازة · شكراً لكم"',
       'review', false
FROM profiles WHERE role = 'owner'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- ✅ انتهى زرع البيانات التجريبيّة
-- ═══════════════════════════════════════════════════════════
