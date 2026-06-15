import { create } from 'zustand';
import {
  cancelBooking,
  checkInBooking,
  createBooking,
  getBookings,
  getLatestConflictCache,
  updateBooking,
} from '@/api/bookingApi';
import { BOOKING_MUTABLE_STATUSES, BookingStatus } from '@/constants/booking';
import { CONFLICT_MESSAGES } from '@/constants/messages';
import type { Booking, BookingDraft } from '@/models/booking';
import { formatBookingStatus } from '@/utils/formatters';
import { roomflowMessage } from '@/utils/message';
import { findRoomConflicts, inferBookingStatus } from '@/utils/timeRange';

interface ConflictCache {
  checkedAt?: string;
  roomId?: string;
  conflictIds: string[];
}

interface BookingState {
  bookings: Booking[];
  conflictCache: ConflictCache;
  loading: boolean;
  initialize: () => Promise<void>;
  refreshStatuses: () => void;
  create: (draft: BookingDraft) => Promise<boolean>;
  cancel: (bookingId: string) => Promise<void>;
  checkIn: (bookingId: string) => Promise<void>;
  edit: (bookingId: string, patch: Partial<Booking>) => Promise<void>;
  findConflicts: (draft: BookingDraft) => Booking[];
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  conflictCache: { conflictIds: [] },
  loading: false,
  async initialize() {
    set({ loading: true });
    try {
      const [bookings, conflictCache] = await Promise.all([getBookings(), getLatestConflictCache()]);
      set({ bookings, conflictCache });
    } finally {
      set({ loading: false });
    }
  },
  refreshStatuses() {
    set((state) => ({
      bookings: state.bookings.map((booking) => ({ ...booking, status: inferBookingStatus(booking) })),
    }));
  },
  async create(draft) {
    const localConflicts = get().findConflicts(draft);
    if (localConflicts.length > 0) {
      roomflowMessage.warning(`${CONFLICT_MESSAGES.conflictFound}：${localConflicts[0].title}`);
      return false;
    }

    set({ loading: true });
    try {
      const saved = await createBooking(draft);
      set((state) => ({
        bookings: [saved, ...state.bookings],
        conflictCache: { checkedAt: new Date().toISOString(), roomId: saved.room_id, conflictIds: [] },
      }));
      roomflowMessage.success(`会议已创建：${saved.title}`);
      return true;
    } catch (error) {
      roomflowMessage.error(
        error instanceof Error
          ? `${CONFLICT_MESSAGES.conflictFound}：${error.message}`
          : CONFLICT_MESSAGES.conflictFound,
      );
      return false;
    } finally {
      set({ loading: false });
    }
  },
  async cancel(bookingId) {
    const bookings = await cancelBooking(bookingId);
    set({ bookings });
    roomflowMessage.warning(`会议已标记为${formatBookingStatus(BookingStatus.CANCELLED)}`);
  },
  async checkIn(bookingId) {
    const bookings = await checkInBooking(bookingId);
    set({ bookings });
    roomflowMessage.success(`会议已签到，当前状态：${formatBookingStatus(BookingStatus.ONGOING)}`);
  },
  async edit(bookingId, patch) {
    const target = get().bookings.find((booking) => booking.id === bookingId);
    if (target && !BOOKING_MUTABLE_STATUSES.includes(target.status)) {
      roomflowMessage.warning(`当前状态 ${formatBookingStatus(target.status)} 不可编辑`);
      return;
    }
    const bookings = await updateBooking(bookingId, patch);
    set({ bookings });
    roomflowMessage.success('会议已更新');
  },
  findConflicts(draft) {
    return findRoomConflicts(get().bookings, draft.room_id, {
      start: draft.start_time,
      end: draft.end_time,
    });
  },
}));
