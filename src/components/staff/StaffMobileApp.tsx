/**
 * StaffMobileApp — تطبيق جوّال فاخر للموظّفة
 * ═══════════════════════════════════════════════════════════
 * - 4 تبويبات: الرئيسية · حجوزاتي · أرباحي · ملفي
 * - bottom nav ثابت
 * - عرض فقط للموبايل (md:hidden)
 */
'use client';

import { useState } from 'react';
import { Home, Calendar, Wallet, User } from 'lucide-react';
import { haptic } from '@/lib/mobile/haptics';
import type { StaffBooking, StaffUser, AttendanceState, StaffEarnings, TabKey } from './types';
import StaffHomeTab from './tabs/StaffHomeTab';
import StaffBookingsTab from './tabs/StaffBookingsTab';
import StaffEarningsTab from './tabs/StaffEarningsTab';
import StaffProfileTab from './tabs/StaffProfileTab';

interface Props {
  user: StaffUser;
  attendance: AttendanceState;
  locationName: string | null;
  todayBookings: StaffBooking[];
  allBookings: StaffBooking[];
  earnings: StaffEarnings;
}

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home',     label: 'الرئيسية', icon: Home },
  { key: 'bookings', label: 'حجوزاتي',  icon: Calendar },
  { key: 'earnings', label: 'أرباحي',   icon: Wallet },
  { key: 'profile',  label: 'ملفي',     icon: User },
];

export default function StaffMobileApp({
  user, attendance, locationName, todayBookings, allBookings, earnings,
}: Props) {
  const [tab, setTab] = useState<TabKey>('home');

  function switchTab(k: TabKey) {
    if (k === tab) return;
    haptic('light');
    setTab(k);
  }

  return (
    <div className="md:hidden min-h-screen bg-gradient-to-b from-cream-50 via-white to-cream-50/50">
      {/* المحتوى */}
      <main>
        {tab === 'home' && (
          <StaffHomeTab
            user={user}
            attendance={attendance}
            locationName={locationName}
            todayBookings={todayBookings}
            earnings={earnings}
          />
        )}
        {tab === 'bookings' && <StaffBookingsTab bookings={allBookings} />}
        {tab === 'earnings' && <StaffEarningsTab earnings={earnings} />}
        {tab === 'profile' && (
          <StaffProfileTab user={user} attendance={attendance} />
        )}
      </main>

      {/* ─── Bottom Navigation ─── */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-cream-200 pb-safe"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around px-2 pt-1.5 pb-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                className="flex-1 flex flex-col items-center py-1 min-w-0 relative"
              >
                <t.icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-gold-deep' : 'text-ink-soft'
                  }`}
                />
                <span
                  className={`text-[10px] mt-0.5 truncate ${
                    active ? 'text-gold-deep font-bold' : 'text-ink-soft'
                  }`}
                >
                  {t.label}
                </span>
                {active && (
                  <span className="absolute bottom-0 w-10 h-0.5 bg-gold-deep rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
