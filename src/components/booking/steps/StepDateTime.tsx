/**
 * StepDateTime — التاريخ والاختصاصية والوقت
 */
'use client';

import { Calendar, Clock, User } from 'lucide-react';
import type { BookingState, SetBookingState } from '../types';
import SummaryStrip from './SummaryStrip';
import StaffPicker from '../StaffPicker';
import TimeSlotPicker from '../TimeSlotPicker';

interface Props {
  state: BookingState;
  setState: SetBookingState;
  subtotal: number;
  duration: number;
}

export default function StepDateTime({ state, setState, subtotal, duration }: Props) {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 60);

  const serviceIds = state.selectedPackageId ? [] : state.selectedServices;

  return (
    <div>
      <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-1">
        التاريخ والاختصاصية والوقت
      </h2>
      <p className="text-sm text-ink-soft mb-6">
        المواعيد المتاحة فقط تظهر حسب جدول الاختصاصية
      </p>

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-2">
          <Calendar className="w-3.5 h-3.5 inline ml-1" />
          التاريخ
        </label>
        <input
          type="date"
          min={today.toISOString().split('T')[0]}
          max={maxDate.toISOString().split('T')[0]}
          value={state.booking_date}
          onChange={(e) => setState({ ...state, booking_date: e.target.value, booking_time: '', staff_id: null })}
          className="w-full px-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
        />
      </div>

      {state.booking_date && (
        <div className="mt-5">
          <label className="block text-xs font-semibold text-ink-soft mb-2">
            <User className="w-3.5 h-3.5 inline ml-1" />
            الاختصاصية
          </label>
          <StaffPicker
            date={state.booking_date}
            serviceIds={serviceIds}
            value={state.staff_id}
            onChange={(id) => setState({ ...state, staff_id: id, booking_time: '' })}
          />
        </div>
      )}

      {state.booking_date && (
        <div className="mt-5">
          <label className="block text-xs font-semibold text-ink-soft mb-2">
            <Clock className="w-3.5 h-3.5 inline ml-1" />
            الوقت المتاح
            {state.staff_id && <span className="text-gold-deep"> (حسب جدول الاختصاصية المختارة)</span>}
          </label>
          <TimeSlotPicker
            date={state.booking_date}
            duration={duration}
            staffId={state.staff_id}
            value={state.booking_time}
            onChange={(time) => setState({ ...state, booking_time: time })}
          />
        </div>
      )}

      <SummaryStrip subtotal={subtotal} duration={duration} count={state.selectedServices.length || 1} />
    </div>
  );
}
