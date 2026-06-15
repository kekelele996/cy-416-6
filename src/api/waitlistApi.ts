import dayjs from 'dayjs';
import { nanoid } from '@/api/id';
import { BookingStatus, WaitlistStatus } from '@/constants/booking';
import type { Booking, BookingDraft } from '@/models/booking';
import type { Waitlist, WaitlistDraft } from '@/models/waitlist';
import { STORAGE_KEYS, readCollection, writeCollection } from '@/utils/storage';
import { doesTimeOverlap } from '@/utils/timeRange';
import { createBooking } from './bookingApi';

export async function getWaitlists(): Promise<Waitlist[]> {
  const waitlists = await readCollection<Waitlist[]>(STORAGE_KEYS.waitlists, []);
  return waitlists.map((waitlist) => ({
    ...waitlist,
    status: inferWaitlistStatus(waitlist),
  }));
}

export async function getPendingWaitlistsForSlot(
  roomId: string,
  range: { start: string; end: string },
): Promise<Waitlist[]> {
  const waitlists = await getWaitlists();
  return waitlists.filter(
    (w) =>
      w.room_id === roomId &&
      w.status === WaitlistStatus.PENDING &&
      doesTimeOverlap(range, { start: w.start_time, end: w.end_time }),
  );
}

export async function getUserWaitlistForSlot(
  userId: string,
  roomId: string,
  range: { start: string; end: string },
): Promise<Waitlist | undefined> {
  const waitlists = await getWaitlists();
  return waitlists.find(
    (w) =>
      w.user_id === userId &&
      w.room_id === roomId &&
      w.status === WaitlistStatus.PENDING &&
      doesTimeOverlap(range, { start: w.start_time, end: w.end_time }),
  );
}

export async function createWaitlist(draft: WaitlistDraft): Promise<Waitlist> {
  const waitlists = await getWaitlists();
  const pendingInSlot = waitlists.filter(
    (w) =>
      w.room_id === draft.room_id &&
      w.status === WaitlistStatus.PENDING &&
      doesTimeOverlap({ start: draft.start_time, end: draft.end_time }, { start: w.start_time, end: w.end_time }),
  );

  const existingUserWaitlist = pendingInSlot.find((w) => w.user_id === draft.user_id);
  if (existingUserWaitlist) {
    throw new Error('DUPLICATE_WAITLIST');
  }

  const maxPosition = pendingInSlot.reduce((max, w) => Math.max(max, w.queue_position), 0);
  const nextWaitlist: Waitlist = {
    ...draft,
    id: draft.id ?? nanoid('waitlist'),
    status: WaitlistStatus.PENDING,
    queue_position: maxPosition + 1,
    created_at: new Date().toISOString(),
  };
  await writeCollection(STORAGE_KEYS.waitlists, [nextWaitlist, ...waitlists]);
  return nextWaitlist;
}

export async function updateWaitlist(waitlistId: string, patch: Partial<Waitlist>): Promise<Waitlist[]> {
  const waitlists = await getWaitlists();
  const nextWaitlists = waitlists.map((w) => (w.id === waitlistId ? { ...w, ...patch } : w));
  return writeCollection(STORAGE_KEYS.waitlists, nextWaitlists);
}

export async function cancelWaitlist(waitlistId: string): Promise<Waitlist[]> {
  const waitlists = await getWaitlists();
  const target = waitlists.find((w) => w.id === waitlistId);
  if (!target) {
    return waitlists;
  }

  const updated = waitlists.map((w) => {
    if (w.id === waitlistId) {
      return { ...w, status: WaitlistStatus.CANCELLED };
    }
    if (
      w.room_id === target.room_id &&
      w.status === WaitlistStatus.PENDING &&
      w.queue_position > target.queue_position &&
      doesTimeOverlap({ start: target.start_time, end: target.end_time }, { start: w.start_time, end: w.end_time })
    ) {
      return { ...w, queue_position: w.queue_position - 1 };
    }
    return w;
  });

  return writeCollection(STORAGE_KEYS.waitlists, updated);
}

export async function tryConvertNextWaitlist(
  roomId: string,
  range: { start: string; end: string },
  ignoreBookingId?: string,
): Promise<{ booking: Booking; waitlist: Waitlist } | null> {
  const waitlists = await getWaitlists();
  const pendingInSlot = waitlists
    .filter(
      (w) =>
        w.room_id === roomId &&
        w.status === WaitlistStatus.PENDING &&
        doesTimeOverlap(range, { start: w.start_time, end: w.end_time }),
    )
    .sort((a, b) => a.queue_position - b.queue_position);

  if (pendingInSlot.length === 0) {
    return null;
  }

  const next = pendingInSlot[0];
  const bookingDraft: BookingDraft = {
    room_id: next.room_id,
    user_id: next.user_id,
    title: next.title,
    attendees: next.attendees,
    start_time: next.start_time,
    end_time: next.end_time,
  };

  const createdBooking = await createBooking(bookingDraft);

  const updatedWaitlists = waitlists.map((w) => {
    if (w.id === next.id) {
      return {
        ...w,
        status: WaitlistStatus.CONVERTED,
        converted_booking_id: createdBooking.id,
        notified_at: new Date().toISOString(),
      };
    }
    if (
      w.room_id === next.room_id &&
      w.status === WaitlistStatus.PENDING &&
      w.queue_position > next.queue_position &&
      doesTimeOverlap(range, { start: w.start_time, end: w.end_time })
    ) {
      return { ...w, queue_position: w.queue_position - 1 };
    }
    return w;
  });
  await writeCollection(STORAGE_KEYS.waitlists, updatedWaitlists);

  return { booking: createdBooking, waitlist: { ...next, status: WaitlistStatus.CONVERTED } };
}

export async function expirePastWaitlists(): Promise<Waitlist[]> {
  const waitlists = await getWaitlists();
  const now = dayjs();
  const updated = waitlists.map((w) => {
    if (w.status === WaitlistStatus.PENDING && now.isAfter(dayjs(w.end_time))) {
      return { ...w, status: WaitlistStatus.EXPIRED };
    }
    return w;
  });
  return writeCollection(STORAGE_KEYS.waitlists, updated);
}

function inferWaitlistStatus(waitlist: Waitlist): WaitlistStatus {
  if (
    waitlist.status === WaitlistStatus.CONVERTED ||
    waitlist.status === WaitlistStatus.CANCELLED ||
    waitlist.status === WaitlistStatus.EXPIRED
  ) {
    return waitlist.status;
  }
  if (dayjs().isAfter(dayjs(waitlist.end_time))) {
    return WaitlistStatus.EXPIRED;
  }
  return WaitlistStatus.PENDING;
}
