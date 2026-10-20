/**
 * useFavorites — المفضّلات (خدمات + موظفات)
 * ═══════════════════════════════════════════════════════════
 * - جلب المفضّلات من قاعدة البيانات (للمسجّلات فقط)
 * - إضافة / إزالة
 * - تحديث فوري عبر Custom Events
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const EVENT = 'befl:favorites-changed';

interface FavoritesState {
  serviceIds: Set<string>;
  staffIds: Set<string>;
  loading: boolean;
  loggedIn: boolean;
}

export function useFavorites() {
  const [state, setState] = useState<FavoritesState>({
    serviceIds: new Set(),
    staffIds: new Set(),
    loading: true,
    loggedIn: false,
  });

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setState({ serviceIds: new Set(), staffIds: new Set(), loading: false, loggedIn: false });
      return;
    }

    const { data } = await supabase
      .from('customer_favorites')
      .select('service_id, staff_id')
      .eq('customer_id', user.id);

    const serviceIds = new Set<string>();
    const staffIds = new Set<string>();
    (data || []).forEach((row: any) => {
      if (row.service_id) serviceIds.add(row.service_id);
      if (row.staff_id) staffIds.add(row.staff_id);
    });

    setState({ serviceIds, staffIds, loading: false, loggedIn: true });
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, [refresh]);

  // ─── toggle خدمة ───
  const toggleService = async (serviceId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const isFav = state.serviceIds.has(serviceId);
    if (isFav) {
      await supabase.from('customer_favorites')
        .delete()
        .eq('customer_id', user.id)
        .eq('service_id', serviceId);
    } else {
      await supabase.from('customer_favorites')
        .insert({ customer_id: user.id, service_id: serviceId });
    }
    window.dispatchEvent(new Event(EVENT));
    return !isFav;
  };

  // ─── toggle موظفة ───
  const toggleStaff = async (staffId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const isFav = state.staffIds.has(staffId);
    if (isFav) {
      await supabase.from('customer_favorites')
        .delete()
        .eq('customer_id', user.id)
        .eq('staff_id', staffId);
    } else {
      await supabase.from('customer_favorites')
        .insert({ customer_id: user.id, staff_id: staffId });
    }
    window.dispatchEvent(new Event(EVENT));
    return !isFav;
  };

  return {
    serviceIds: state.serviceIds,
    staffIds: state.staffIds,
    loading: state.loading,
    loggedIn: state.loggedIn,
    isService: (id: string) => state.serviceIds.has(id),
    isStaff: (id: string) => state.staffIds.has(id),
    toggleService,
    toggleStaff,
    refresh,
    count: state.serviceIds.size + state.staffIds.size,
  };
}
