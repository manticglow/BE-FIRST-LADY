/**
 * create-test-users.ts
 * ═══════════════════════════════════════════════════════════
 * ينشئ 4 حسابات اختبار بأدوار مختلفة · شغّليه مرّة واحدة بعد نشر Supabase
 *
 * التشغيل:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/create-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error('❌ ضيفي المفاتيح في المتغيّرات:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  {
    email: 'owner@befirstlady.com',
    password: 'Owner@2026!',
    full_name: 'غد العتيبي',
    phone: '966504389329',
    role: 'owner' as const,
    emoji: '👑',
    hourly_rate: null,
    monthly_salary: null,
  },
  {
    email: 'manager@befirstlady.com',
    password: 'Manager@2026!',
    full_name: 'نورة الحربي',
    phone: '966555123456',
    role: 'manager' as const,
    emoji: '🛡',
    hourly_rate: null,
    monthly_salary: 8000,
  },
  {
    email: 'staff@befirstlady.com',
    password: 'Staff@2026!',
    full_name: 'هديل القحطاني',
    phone: '966544567890',
    role: 'staff' as const,
    emoji: '💼',
    hourly_rate: 40,
    monthly_salary: null,
  },
  {
    email: 'customer@befirstlady.com',
    password: 'Customer@2026!',
    full_name: 'سارة الزهراني',
    phone: '966566789012',
    role: 'customer' as const,
    emoji: '🌸',
    hourly_rate: null,
    monthly_salary: null,
  },
];

async function run() {
  console.log('🌸 بدء إنشاء حسابات الاختبار...\n');

  for (const u of TEST_USERS) {
    try {
      // 1. تحقّق هل موجود
      const { data: existing } = await admin.auth.admin.listUsers();
      const found = existing.users.find((x) => x.email === u.email);

      let userId: string;

      if (found) {
        userId = found.id;
        console.log(`${u.emoji} موجود مسبقاً: ${u.email} — تحديث البيانات...`);
      } else {
        const { data: created, error } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, phone: u.phone },
        });
        if (error) throw error;
        userId = created.user.id;
        console.log(`${u.emoji} أُنشئ: ${u.email}`);
      }

      // 2. upsert في profiles
      const { error: pErr } = await admin.from('profiles').upsert(
        {
          id: userId,
          full_name: u.full_name,
          phone: u.phone,
          role: u.role,
          email: u.email,
          hourly_rate: u.hourly_rate,
          monthly_salary: u.monthly_salary,
        },
        { onConflict: 'id' }
      );
      if (pErr) throw pErr;

      console.log(`   ↳ البروفايل مُحدَّث · الدور: ${u.role}`);
    } catch (e: any) {
      console.error(`   ✗ خطأ في ${u.email}:`, e.message);
    }
  }

  console.log('\n✅ انتهى. حسابات الاختبار جاهزة:\n');
  console.log('   👑 owner@befirstlady.com    / Owner@2026!');
  console.log('   🛡 manager@befirstlady.com  / Manager@2026!');
  console.log('   💼 staff@befirstlady.com    / Staff@2026!');
  console.log('   🌸 customer@befirstlady.com / Customer@2026!');
  console.log('\n⚠️  غيّري كلمات المرور قبل النشر الفعلي للعميلات.');
}

run().catch((e) => {
  console.error('💥 فشل:', e);
  process.exit(1);
});
