/**
 * POST /api/admin/upload-image
 * ═══════════════════════════════════════════════════════════
 * رفع صورة إلى Supabase Storage (bucket: service-images)
 *
 * Body: FormData · file (image) · folder (اختياري)
 * Response: { ok, url, path }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export async function POST(req: NextRequest) {
  // 🔒 require admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes((profile as any).role)) {
    return NextResponse.json({ ok: false, error: 'للمالكة/المديرة فقط' }, { status: 403 });
  }

  // 🛡 rate limit · 20 رفع/دقيقة
  const rl = await checkRateLimit({
    key: user.id,
    category: 'image-upload',
    max: 20,
    windowSec: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'محاولات كثيرة · انتظري قليلاً' },
      { status: 429 },
    );
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const folder = (formData.get('folder') as string) || 'services';

  if (!file) {
    return NextResponse.json({ ok: false, error: 'ما في ملف' }, { status: 400 });
  }

  // ✅ تحقّق من النوع والحجم
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { ok: false, error: 'نوع الملف غير مدعوم · استخدمي JPG · PNG · WebP' },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: `الحجم أكبر من ${MAX_SIZE_MB}MB` },
      { status: 400 },
    );
  }

  // تنظيف الـfolder للـpath
  const safeFolder = folder.replace(/[^a-z0-9-/]/gi, '').slice(0, 50) || 'services';

  // اسم فريد (prevent cache issues)
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `${safeFolder}/${fileName}`;

  // ارفعي للـStorage
  const admin = createAdminClient();
  const bucket = 'service-images';

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await admin.storage
    .from(bucket)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    return NextResponse.json(
      { ok: false, error: `فشل الرفع: ${error.message}` },
      { status: 500 },
    );
  }

  // الـURL العامّ
  const { data: urlData } = admin.storage.from(bucket).getPublicUrl(filePath);

  return NextResponse.json({
    ok: true,
    url: urlData.publicUrl,
    path: filePath,
  });
}
