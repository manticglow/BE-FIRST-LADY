'use client';

/**
 * HeaderSearchLazy — Fetches data in background on mount
 */
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Service, Package, Category } from '@/types/database';
import HeaderSearch from './HeaderSearch';

interface SearchData {
  services: Service[];
  packages: Package[];
  categories: Category[];
}

export default function HeaderSearchLazy({ headless }: { headless?: boolean }) {
  const [data, setData] = useState<SearchData>({
    services: [], packages: [], categories: [],
  });

  // تحميل في الخلفيّة بدون blocking
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/search/data', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => { /* ignore */ });
    return () => controller.abort();
  }, []);

  return (
    <HeaderSearch
      services={data.services}
      packages={data.packages}
      categories={data.categories}
      headless={headless}
    />
  );
}
