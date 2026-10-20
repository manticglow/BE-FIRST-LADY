/**
 * /account/favorites — مفضّلات العميلة
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/account/favorites');

  // جلب المفضّلات مع تفاصيل الخدمات والموظفات
  const { data: favorites } = await supabase
    .from('customer_favorites')
    .select(`
      id, created_at,
      service:services(id, name_ar, name_en, price, price_from, duration_min, image_url, description_ar),
      staff:staff(id, name, job_title, avatar_url)
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  const serviceFavs = (favorites || []).filter((f: any) => f.service);
  const staffFavs = (favorites || []).filter((f: any) => f.staff);

  return (
    <div className="min-h-screen bg-cream-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link
            href="/account"
            className="w-10 h-10 rounded-full border border-cream-200 flex items-center justify-center text-ink-soft hover:text-gold-deep transition-colors"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </Link>
          <h1 className="font-ar-display text-xl font-bold text-gold-deep flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            مفضّلتكِ
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6">
        {favorites?.length === 0 || !favorites ? (
          <EmptyState />
        ) : (
          <div className="space-y-8">
            {/* الخدمات المفضّلة */}
            {serviceFavs.length > 0 && (
              <section>
                <h2 className="font-ar-display text-lg font-bold text-ink mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-deep" />
                  خدماتكِ المفضّلة · {serviceFavs.length}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {serviceFavs.map((f: any) => (
                    <ServiceFavCard key={f.id} service={f.service} />
                  ))}
                </div>
              </section>
            )}

            {/* الموظفات المفضّلات */}
            {staffFavs.length > 0 && (
              <section>
                <h2 className="font-ar-display text-lg font-bold text-ink mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  موظفاتكِ المفضّلات · {staffFavs.length}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {staffFavs.map((f: any) => (
                    <StaffFavCard key={f.id} staff={f.staff} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl border border-cream-200 p-10 text-center shadow-sm mt-8">
      <div className="w-20 h-20 rounded-full bg-rose-50 mx-auto flex items-center justify-center mb-4">
        <Heart className="w-10 h-10 text-rose-300" />
      </div>
      <h3 className="font-ar-display text-xl font-bold text-ink mb-2">
        لسه ما حفظتِ أي شي
      </h3>
      <p className="text-sm text-ink-soft mb-6 leading-relaxed">
        اضغطي على القلب ❤️ عند أي خدمة أو موظفة تحبّينها لتظهر هنا
      </p>
      <Link
        href="/services"
        className="inline-flex items-center gap-2 bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform"
      >
        <Sparkles className="w-4 h-4" />
        تصفّحي الخدمات
      </Link>
    </div>
  );
}

function ServiceFavCard({ service }: { service: any }) {
  return (
    <Link
      href={`/services/${service.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-cream-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="relative aspect-[16/10] bg-cream-100">
        {service.image_url && (
          <Image
            src={service.image_url}
            alt={service.name_ar}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-ar-display font-bold text-ink line-clamp-1 mb-1">
          {service.name_ar}
        </h3>
        <div className="flex items-baseline justify-between pt-2 border-t border-cream-100 mt-2">
          <span className="text-xs text-ink-soft">{formatDuration(service.duration_min)}</span>
          <span className="font-en-display font-bold text-gold-deep">
            {formatPrice(service.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function StaffFavCard({ staff }: { staff: any }) {
  return (
    <div className="bg-white rounded-2xl p-4 text-center border border-cream-200 shadow-sm">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-light/30 to-cream-100 mx-auto flex items-center justify-center text-2xl font-bold text-gold-deep mb-3">
        {staff.avatar_url ? (
          <Image
            src={staff.avatar_url}
            alt={staff.name}
            width={80} height={80}
            className="rounded-full object-cover"
          />
        ) : (
          <span>{staff.name.charAt(0)}</span>
        )}
      </div>
      <h3 className="font-ar-display font-bold text-ink text-sm">{staff.name}</h3>
      <p className="text-xs text-ink-soft mt-0.5">{staff.job_title}</p>
    </div>
  );
}
