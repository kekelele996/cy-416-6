import { useMemo } from 'react';
import { CONFLICT_MESSAGES } from '@/constants/messages';
import type { BookingDraft } from '@/models/booking';
import { useBookingStore } from '@/stores/bookingStore';
import { findRoomConflicts } from '@/utils/timeRange';

export function useTimeConflict(draft: Partial<BookingDraft>) {
  const bookings = useBookingStore((state) => state.bookings);

  return useMemo(() => {
    if (!draft.room_id || !draft.start_time || !draft.end_time) {
      return {
        hasConflict: false,
        conflicts: [],
        message: '请选择会议室和完整时间段',
      };
    }

    const conflicts = findRoomConflicts(bookings, draft.room_id, {
      start: draft.start_time,
      end: draft.end_time,
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      message:
        conflicts.length > 0
          ? `${CONFLICT_MESSAGES.conflictFound}：${conflicts.map((item) => item.title).join('、')}`
          : CONFLICT_MESSAGES.noConflict,
    };
  }, [bookings, draft.room_id, draft.start_time, draft.end_time]);
}
