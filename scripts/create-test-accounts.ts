/**
 * 🌸 إنشاء 3 حسابات تجريبيّة · The First Lady
 * ═══════════════════════════════════════════════════════════
 * - 👑 رغد الزهراني · مالكة  (owner@thefirstlady.sa)
 * - 👩‍💼 ريناد السالم · موظّفة (renad@thefirstlady.sa)
 * - 🌸 غيداء العتيبي · عميلة  (ghaida@thefirstlady.sa)
 *
 * ──────────────────────────────────────────
 * طريقة التشغيل:
 *   1. تأكّدي إنّ .env.local فيه:
 *      NEXT_PUBLIC_SUPABASE_URL
 *      SUPABASE_SERVICE_ROLE_KEY
 *   2. في Terminal:
 *      npx tsx scripts/create-test-accounts.ts
 *   3. راح تطبع الحسابات مع كلمات المرور
 * ──────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// حمّلي .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ لازم NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─────────────────────────────────────────────────────────────────
// الحسابات الثلاثة
// ─────────────────────────────────────────────────────────────────
const ACCOUNTS = [
  {
    email: 'owner@thefirstlady.sa',
    password: 'Raghad@2026!',
    full_name: 'رغد الزهراني',
    phone: '0504134147',
    role: 'owner' as const,
    icon: '👑',
    description: 'المالكة · صاحبة الصالون',
    // بيانات إضافيّة للمالكة
    marketing_consent: false,
  },
  {
    email: 'renad@thefirstlady.sa',
    password: 'Renad@2026!',
    full_name: 'ريناد السالم',
    phone: '0501234567',
    role: 'staff' as const,
    icon: '👩‍💼',
    description: 'موظّفة · أخصّائية سبا وتشقير',
    // بيانات الموظّفة
    job_title: 'أخصّائية سبا وتشقير',
    specialties: ['سبا', 'مساج', 'تشقير', 'بشرة'],
  },
  {
    email: 'ghaida@thefirstlady.sa',
    password: 'Ghaida@2026!',
    full_name: 'غيداء العتيبي',
    phone: '0509876543',
    role: 'customer' as const,
    icon: '🌸',
    description: 'عميلة · للاختبار',
    marketing_consent: true,
    birthday: '1998-04-15',
  },
];

// ─────────────────────────────────────────────────────────────────
async function createAccount(acc: typeof ACCOUNTS[number]) {
  console.log(`\n${acc.icon} إنشاء: ${acc.full_name}`);

  // تحقّقي إذا كان موجود مسبقاً
  const { data: existingList } = await admin.auth.admin.listUsers();
  const existing = existingList?.users?.find((u) => u.email === acc.email);

  let userId: string;

  if (existing) {
    console.log(`   ⚠️ موجود مسبقاً · أحدّث بياناته`);
    userId = existing.id;
    // حدّثي كلمة المرور
    await admin.auth.admin.updateUserById(userId, { password: acc.password });
  } else {
    // أنشئي الحساب
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      phone: acc.phone,
      user_metadata: {
        full_name: acc.full_name,
        phone: acc.phone,
      },
    });

    if (error || !newUser.user) {
      console.error(`   ❌ فشل الإنشاء:`, error?.message);
      return null;
    }

    userId = newUser.user.id;
    console.log(`   ✓ تمّ إنشاء auth.user`);
  }

  // أنشئي/حدّثي profile
  const profilePayload: any = {
    id: userId,
    email: acc.email,
    full_name: acc.full_name,
    phone: acc.phone,
    role: acc.role,
  };
  if ('marketing_consent' in acc) {
    profilePayload.marketing_consent = acc.marketing_consent;
    if (acc.marketing_consent) {
      profilePayload.marketing_consent_at = new Date().toISOString();
    }
  }
  if ('birthday' in acc) profilePayload.birthday = acc.birthday;

  const { error: profileErr } = await admin
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' });

  if (profileErr) {
    console.error(`   ❌ فشل profile:`, profileErr.message);
    return null;
  }
  console.log(`   ✓ profile محدّث (role=${acc.role})`);

  // لو موظّفة · أضيفي للـstaff
  if (acc.role === 'staff' && 'job_title' in acc) {
    const { error: staffErr } = await admin.from('staff').upsert({
      profile_id: userId,
      name: acc.full_name,
      job_title: (acc as any).job_title,
      specialties: (acc as any).specialties,
      is_active: true,
      display_order: 20,
    }, { onConflict: 'profile_id' });

    if (staffErr) {
      console.warn(`   ⚠️ تعذّر إضافة للـstaff:`, staffErr.message);
    } else {
      console.log(`   ✓ أُضيفت في جدول الموظّفات`);

      // جدول دوام افتراضي (الأحد-الخميس · 10ص-10م)
      const staffId = (await admin.from('staff').select('id').eq('profile_id', userId).single()).data?.id;
      if (staffId) {
        const scheduleRows = [0, 1, 2, 3, 4].map((day) => ({
          staff_id: staffId,
          day_of_week: day,
          start_time: '10:00',
          end_time: '22:00',
        }));
        await admin.from('staff_schedule').upsert(scheduleRows, { onConflict: 'staff_id,day_of_week' });
        console.log(`   ✓ جدول دوام 5 أيّام أسبوعياً`);
      }
    }
  }

  return { ...acc, userId };
}

// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('🌸 إنشاء الحسابات التجريبيّة · The First Lady');
  console.log('═══════════════════════════════════════════════');

  const results = [];
  for (const acc of ACCOUNTS) {
    const r = await createAccount(acc);
    if (r) results.push(r);
  }

  // التقرير النهائي
  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('║  ✅ تمّ إنشاء الحسابات بنجاح                          ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  for (const r of results) {
    console.log(`\n${r.icon} ${r.full_name} · ${r.description}`);
    console.log(`   📧 الإيميل:     ${r.email}`);
    console.log(`   🔑 الباسوورد:   ${r.password}`);
    console.log(`   📱 الجوّال:     ${r.phone}`);
    console.log(`   🎭 الدور:       ${r.role}`);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('🚀 جرّبي الدخول:');
  console.log('   https://thefirstlady.sa/login');
  console.log('═══════════════════════════════════════════════\n');
}

main().catch((e) => {
  console.error('\n❌ خطأ:', e);
  process.exit(1);
});
