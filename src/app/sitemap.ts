import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://befirstlady.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // الصفحات الثابتة
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                        lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/booking`,            lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/packages`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/gift-cards`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/legal/privacy`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ];

  // الخدمات (دينامياً)
  try {
    const { data: services } = await supabase
      .from('services')
      .select('id, updated_at')
      .eq('is_active', true);

    const servicePages: MetadataRoute.Sitemap = (services || []).map((s: any) => ({
      url: `${BASE_URL}/services/${s.id}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticPages, ...servicePages];
  } catch {
    return staticPages;
  }
}
