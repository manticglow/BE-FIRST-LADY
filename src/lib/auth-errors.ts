/**
 * ترجمة أخطاء Supabase Auth إلى عربيّة راقية
 * ═══════════════════════════════════════════════════════════
 * لا تسريب لإنجليزيّة فنيّة خام في براند فاخر.
 */

export function translateAuthError(err: unknown): string {
  const raw = typeof err === 'string' ? err : (err as any)?.message || '';
  const msg = raw.toLowerCase();

  // ─── أخطاء شائعة في التسجيل ───
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'هذا الإيميل مسجّل مسبقاً · جرّبي تسجيل الدخول 💛';
  }
  if (msg.includes('email rate limit') || msg.includes('too many requests')) {
    return 'أرسلنا لكِ عدة محاولات · انتظري دقيقة ثمّ حاولي مجدّداً 🤍';
  }
  if (msg.includes('password should be at least')) {
    return 'كلمة السر قصيرة · لتكن 8 أحرف على الأقل';
  }
  if (msg.includes('weak_password') || msg.includes('password is too weak')) {
    return 'كلمة السر ضعيفة · أضيفي أحرف كبيرة وأرقام';
  }
  if (msg.includes('invalid email')) {
    return 'تأكّدي من صيغة الإيميل';
  }

  // ─── أخطاء تسجيل الدخول ───
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'الإيميل أو كلمة السر غير صحيحة · حاولي مرّة ثانية';
  }
  if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
    return 'افتحي بريدكِ وأكّدي حسابكِ أوّلاً 💌';
  }
  if (msg.includes('user not found')) {
    return 'ما لقينا حساب بهذه البيانات · تأكّدي من الإيميل';
  }

  // ─── أخطاء OTP ───
  if (msg.includes('expired') && msg.includes('otp')) {
    return 'انتهت صلاحيّة الرمز · اطلبي رمزاً جديداً 🌸';
  }
  if (msg.includes('invalid otp') || msg.includes('wrong code')) {
    return 'الرمز غير صحيح · تأكّدي من آخر رسالة واتساب';
  }

  // ─── أخطاء الجلسة ───
  if (msg.includes('session') && (msg.includes('expired') || msg.includes('invalid'))) {
    return 'انتهت جلستكِ · سجّلي دخول مرّة ثانية 💛';
  }
  if (msg.includes('not authorized') || msg.includes('unauthorized')) {
    return 'تحتاجين تسجيل دخول للمتابعة';
  }

  // ─── أخطاء شبكة ───
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'تعثّر الاتصال · تحقّقي من الشبكة 🤍';
  }

  // ─── Fallback ───
  if (raw && raw.length < 100) {
    // لو الرسالة قصيرة وعربيّة أصلاً · أعيديها
    if (/[؀-ۿ]/.test(raw)) return raw;
  }
  return 'لم يكتمل الطلب · حاولي مرّة ثانية 🤍';
}
