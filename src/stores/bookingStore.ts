import { create } from 'zustand';
import dayjs from 'dayjs';
import {
  cancelBooking,
  checkInBooking,
  createBooking,
  getBookings,
  getLatestConflictCache,
  updateBooking,
} from '@/api/bookingApi';
import {
  createWaitlistConvertedNotification,
  getNotifications,
  markNotificationRead as persistMarkRead,
  clearNotification as persistClear,
  getUserNotifications,
} from '@/api/notificationApi';
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
import { NotificationType, type Notification } from '@/models/notification';
import type { Booking, BookingDraft } from '@/models/booking';
import type { Waitlist, WaitlistDraft } from '@/models/waitlist';
import { formatBookingStatus, formatDate, formatTimeRange } from '@/utils/formatters';
import { roomflowMessage } from '@/utils/message';
import { findRoomConflicts, inferBookingStatus } from '@/utils/timeRange';

interface ConflictCache {
  checkedAt?: string;
  roomId?: string;
  conflictIds: string[];
}

interface BookingState {
  bookings: Booking[];
  waitlists: Waitlist[];
  conflictCache: ConflictCache;
  notifications: Notification[];
  loading: boolean;
  initialize: () => Promise<void>;
  refreshStatuses: () => void;
  refreshWaitlists: () => Promise<void>;
  refreshNotifications: (userId: string) => Promise<void>;
  restoreNotificationsFromWaitlists: (userId: string, rooms: Array<{ id: string; name: string }>) => Promise<void>;
  create: (draft: BookingDraft) => Promise<boolean>;
  cancel: (bookingId: string, rooms: Array<{ id: string; name: string }>) => Promise<void>;
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
  markNotificationRead: (id: string) => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
}

function buildConvertedDescription(
  booking: Pick<Booking, 'title' | 'room_id' | 'start_time' | 'end_time'>,
  rooms: Array<{ id: string; name: string }>,
): string {
  const roomName = rooms.find((r) => r.id === booking.room_id)?.name ?? '会议室';
  return `「${booking.title}」已候补转正，${roomName} · ${formatDate(booking.start_time)} ${formatTimeRange(booking.start_time, booking.end_time)}，点击查看详情`;
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
      const [bookings, conflictCache, waitlists, notifications] = await Promise.all([
        getBookings(),
        getLatestConflictCache(),
        expirePastWaitlists(),
        getNotifications(),
      ]);
      set({ bookings, conflictCache, waitlists, notifications });
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

  async refreshNotifications(userId) {
    const notifications = await getUserNotifications(userId);
    set({ notifications });
  },

  async restoreNotificationsFromWaitlists(userId, rooms) {
    const { waitlists, bookings, notifications: existingNotifs } = get();
    const convertedByUser = waitlists.filter(
      (w) => w.user_id === userId && w.status === WaitlistStatus.CONVERTED && w.converted_booking_id,
    );
    const notifMap = new Map(
      existingNotifs
        .filter((n) => n.type === NotificationType.WAITLIST_CONVERTED && n.user_id === userId)
        .map((n) => [n.booking_id, n]),
    );
    const bookingMap = new Map(bookings.map((b) => [b.id, b]));
    const missing: Array<Promise<Notification>> = [];

    for (const w of convertedByUser) {
      if (notifMap.has(w.converted_booking_id!)) {
        continue;
      }
      const booking = bookingMap.get(w.converted_booking_id!);
      if (!booking) {
        continue;
      }
      missing.push(
        createWaitlistConvertedNotification({
          userId,
          bookingId: booking.id,
          waitlistId: w.id,
          title: WAITLIST_MESSAGES.convertedTitle,
          description: buildConvertedDescription(booking, rooms),
        }),
      );
    }

    if (missing.length > 0) {
      await Promise.all(missing);
      const refreshed = await getUserNotifications(userId);
      set({ notifications: refreshed });
    }
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

  async cancel(bookingId, rooms) {
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
      const { booking } = result.converted;
      await createWaitlistConvertedNotification({
        userId: booking.user_id,
        bookingId: booking.id,
        waitlistId: result.converted.waitlistId,
        title: WAITLIST_MESSAGES.convertedTitle,
        description: buildConvertedDescription(booking, rooms),
      });
      const refreshed = await getUserNotifications(booking.user_id);
      set((state) => ({
        notifications: state.notifications.some((n) => n.user_id !== booking.user_id)
          ? [...state.notifications.filter((n) => n.user_id !== booking.user_id), ...refreshed]
          : refreshed,
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

  async markNotificationRead(id) {
    await persistMarkRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true, read_at: dayjs().toISOString() } : n,
      ),
    }));
  },

  async clearNotification(id) {
    await persistClear(id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
