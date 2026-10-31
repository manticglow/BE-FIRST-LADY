/**
 * Admin · Salon Location Settings
 * ═══════════════════════════════════════════════════════════
 * صفحة لتحديد موقع الصالون + نطاق المسموح
 */
import SalonLocationManager from '@/components/admin/SalonLocationManager';
import { MapPin } from 'lucide-react';

export default function SalonLocationPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="editorial-eyebrow text-ink-soft mb-1">LOCATION SETTINGS</div>
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep flex items-center gap-2">
          <MapPin className="w-7 h-7" />
          موقع الصالون
        </h1>
        <p className="text-ink-soft text-sm mt-2">
          هذا الموقع يُستخدم للتحقّق من حضور وانصراف الموظفات.
          الموظفة لازم تكون داخل النطاق المحدّد لتسجّل حضورها.
        </p>
      </div>

      <SalonLocationManager />
    </div>
  );
}
