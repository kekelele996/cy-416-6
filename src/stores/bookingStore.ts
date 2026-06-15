import { create } from 'zustand';
import {
  cancelBooking,
  checkInBooking,
  createBooking,
  getBookings,
  getLatestConflictCache,
  updateBooking,
} from '@/api/bookingApi';
import {
  cancelWaitlist,
  createWaitlist,
  expirePastWaitlists,
  getPendingWaitlistsForSlot,
  getUserWaitlistForSlot,
  getWaitlists,
} from '@/api/waitlistApi';
import { BOOKING_MUTABLE_STATUSES, BookingStatus, WaitlistStatus } from '@/constants/booking';
import { CONFLICT_MESSAGES, WAITLIST_MESSAGES } from '@/constants/messages';
import type { Booking, BookingDraft } from '@/models/booking';
import type { Waitlist, WaitlistDraft } from '@/models/waitlist';
import { formatBookingStatus } from '@/utils/formatters';
import { roomflowMessage } from '@/utils/message';
import { findRoomConflicts, inferBookingStatus } from '@/utils/timeRange';

interface ConflictCache {
  checkedAt?: string;
  roomId?: string;
  conflictIds: string[];
}

interface WaitlistConvertNotification {
  id: string;
  booking: Booking;
  waitlistId: string;
  read: boolean;
  createdAt: string;
}

interface BookingState {
  bookings: Booking[];
  waitlists: Waitlist[];
  conflictCache: ConflictCache;
  notifications: WaitlistConvertNotification[];
  loading: boolean;
  initialize: () => Promise<void>;
  refreshStatuses: () => void;
  refreshWaitlists: () => Promise<void>;
  create: (draft: BookingDraft) => Promise<boolean>;
  cancel: (bookingId: string) => Promise<void>;
  checkIn: (bookingId: string) => Promise<void>;
  edit: (bookingId: string, patch: Partial<Booking>) => Promise<void>;
  findConflicts: (draft: BookingDraft) => Booking[];
  joinWaitlist: (draft: WaitlistDraft) => Promise<Waitlist | null>;
  leaveWaitlist: (waitlistId: string) => Promise<void>;
  getUserPendingWaitlistForSlot: (
    userId: string,
    roomId: string,
    range: { start: string; end: string },
  ) => Promise<Waitlist | undefined>;
  getPendingForSlot: (roomId: string, range: { start: string; end: string }) => Promise<Waitlist[]>;
  markNotificationRead: (id: string) => void;
  clearNotification: (id: string) => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  waitlists: [],
  conflictCache: { conflictIds: [] },
  notifications: [],
  loading: false,
  async initialize() {
    set({ loading: true });
    try {
      const [bookings, conflictCache, waitlists] = await Promise.all([
        getBookings(),
        getLatestConflictCache(),
        expirePastWaitlists(),
      ]);
      set({ bookings, conflictCache, waitlists });
    } finally {
      set({ loading: false });
    }
  },
  refreshStatuses() {
    set((state) => ({
      bookings: state.bookings.map((booking) => ({ ...booking, status: inferBookingStatus(booking) })),
    }));
  },
  async refreshWaitlists() {
    const waitlists = await expirePastWaitlists();
    set({ waitlists });
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
    const result = await cancelBooking(bookingId);
    set((state) => ({
      bookings: result.bookings,
      waitlists: state.waitlists.map((w) =>
        result.converted?.waitlistId === w.id
          ? { ...w, status: WaitlistStatus.CONVERTED, converted_booking_id: result.converted!.booking.id }
          : w,
      ),
    }));
    roomflowMessage.warning(`会议已标记为${formatBookingStatus(BookingStatus.CANCELLED)}`);

    if (result.converted) {
      const notification: WaitlistConvertNotification = {
        id: `notif-${result.converted.booking.id}`,
        booking: result.converted.booking,
        waitlistId: result.converted.waitlistId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        notifications: [notification, ...state.notifications],
      }));
      get().refreshWaitlists();
    }
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
  async joinWaitlist(draft) {
    set({ loading: true });
    try {
      const saved = await createWaitlist(draft);
      set((state) => ({
        waitlists: [saved, ...state.waitlists],
      }));
      roomflowMessage.success(
        `${WAITLIST_MESSAGES.joined}${WAITLIST_MESSAGES.positionPrefix}${saved.queue_position}${WAITLIST_MESSAGES.positionSuffix}`,
      );
      return saved;
    } catch (error) {
      if (error instanceof Error && error.message === 'DUPLICATE_WAITLIST') {
        roomflowMessage.warning(CONFLICT_MESSAGES.waitlistAlreadyJoined);
      } else {
        roomflowMessage.error('加入候补失败，请稍后再试');
      }
      return null;
    } finally {
      set({ loading: false });
    }
  },
  async leaveWaitlist(waitlistId) {
    const waitlists = await cancelWaitlist(waitlistId);
    set({ waitlists });
    roomflowMessage.info(WAITLIST_MESSAGES.cancelled);
  },
  async getUserPendingWaitlistForSlot(userId, roomId, range) {
    return getUserWaitlistForSlot(userId, roomId, range);
  },
  async getPendingForSlot(roomId, range) {
    return getPendingWaitlistsForSlot(roomId, range);
  },
  markNotificationRead(id) {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },
  clearNotification(id) {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
