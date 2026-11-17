/**
 * /account/security — إعدادات الأمان (Face ID, 2FA, etc)
 */
import FaceIdSetup from '@/components/auth/FaceIdSetup';
import { Shield } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="max-w-xl mx-auto p-4 pb-32">
      <div className="text-center mb-6 mt-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gold-light/30 to-cream-100 flex items-center justify-center mb-3">
          <Shield className="w-8 h-8 text-gold-deep" />
        </div>
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep">الأمان والدخول</h1>
        <p className="text-ink-soft text-sm mt-1">فعّلي الدخول السريع · واحمي حسابكِ</p>
      </div>

      <div className="space-y-4">
        <FaceIdSetup />
      </div>
    </div>
  );
}
