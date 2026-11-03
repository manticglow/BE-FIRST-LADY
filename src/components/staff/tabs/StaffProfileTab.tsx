/**
 * StaffProfileTab — الملف الشخصي + الروابط السريعة + الخروج
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  User, Clock, Umbrella, Calendar, Settings, LogOut, ChevronLeft,
  Phone, Shield, HelpCircle, Award,
} from 'lucide-react';
import type { StaffUser, AttendanceState } from '../types';
import { createClient } from '@/lib/supabase/client';

export default function StaffProfileTab({
  user, attendance,
}: {
  user: StaffUser;
  attendance: AttendanceState;
}) {
  const router = useRouter();

  async function handleLogout() {
    if (!confirm('متأكّدة من تسجيل الخروج؟')) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('تم تسجيل الخروج');
    router.push('/login');
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div>
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
          MY PROFILE
        </div>
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep">
          ملفي الشخصي
        </h1>
      </div>

      {/* ─── بطاقة الهوية ─── */}
      <div className="relative bg-gradient-to-br from-gold-deep via-amber-700 to-ink text-cream-50 rounded-3xl p-5 shadow-xl overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gold-light/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-gold-light/40 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-light to-gold-deep flex items-center justify-center font-ar-display font-bold text-2xl text-cream-50 shadow-lg">
              {user.firstName.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-en-label text-[9px] tracking-[0.25em] text-gold-light/80 mb-0.5">
              STAFF
            </div>
            <h2 className="font-ar-display font-bold text-xl truncate">{user.fullName}</h2>
            <div className="text-[11px] opacity-75 flex items-center gap-1 mt-1">
              <Award className="w-3 h-3" />
              <span>موظّفة في Be First Lady</span>
            </div>
          </div>
        </div>

        {/* إحصائيات صغيرة */}
        <div className="relative grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/15">
          <div>
            <div className="text-[10px] opacity-70">هذا الأسبوع</div>
            <div className="font-en-display font-bold text-lg">
              {attendance.weekHours}س
            </div>
            <div className="text-[9px] opacity-60">
              {attendance.weekDays} {attendance.weekDays === 1 ? 'يوم' : 'أيّام'}
            </div>
          </div>
          <div>
            <div className="text-[10px] opacity-70">الحالة الآن</div>
            <div className="font-bold text-sm flex items-center gap-1 mt-0.5">
              {attendance.isCheckedIn ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  في العمل
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-gold-light/50" />
                  غير متواجدة
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── روابط سريعة ─── */}
      <div className="space-y-2">
        <ProfileLink
          href="/account/attendance"
          icon={Clock}
          label="سجلّ الحضور"
          sub="آخر 14 يوم · ساعات العمل · التفاصيل"
          color="bg-emerald-50 text-emerald-700"
        />
        <ProfileLink
          href="/account/leaves"
          icon={Umbrella}
          label="طلب إجازة"
          sub="سنويّة · مرضيّة · طارئة"
          color="bg-amber-50 text-amber-700"
        />
        <ProfileLink
          href="/account/profile"
          icon={User}
          label="بياناتي الشخصيّة"
          sub="الاسم · الجوال · الصورة · البريد"
          color="bg-rose-50 text-rose-700"
        />
      </div>

      {/* ─── تواصل ومساعدة ─── */}
      <div className="bg-gradient-to-br from-gold-light/10 to-cream-50 border border-gold-light/30 rounded-2xl p-4">
        <h3 className="font-ar-display font-bold text-gold-deep mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          تحتاجين مساعدة؟
        </h3>
        <div className="space-y-2">
          <a
            href="tel:+966504389329"
            className="flex items-center justify-between py-2 px-3 rounded-xl bg-white hover:bg-cream-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gold-deep" />
              <span>اتّصلي بالمديرة</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-ink-soft" />
          </a>
          <a
            href="https://wa.me/966504389329"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-2 px-3 rounded-xl bg-white hover:bg-cream-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>بلّغي عن مشكلة</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-ink-soft" />
          </a>
        </div>
      </div>

      {/* ─── Logout ─── */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition-colors border border-rose-200"
      >
        <LogOut className="w-4 h-4" />
        تسجيل خروج
      </button>

      {/* نسخة البرنامج */}
      <div className="text-center text-[10px] text-ink-soft/60 pt-4">
        Be First Lady · staff app v1.0
      </div>
    </div>
  );
}

function ProfileLink({
  href, icon: Icon, label, sub, color,
}: {
  href: string;
  icon: typeof User;
  label: string;
  sub: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white border border-cream-200 rounded-2xl p-3.5 hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-ink">{label}</div>
        <div className="text-[11px] text-ink-soft truncate">{sub}</div>
      </div>
      <ChevronLeft className="w-4 h-4 text-ink-soft shrink-0" />
    </Link>
  );
}
