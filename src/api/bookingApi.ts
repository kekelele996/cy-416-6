import { nanoid } from '@/api/id';
import { seedBookings } from '@/api/seed';
import { BookingStatus } from '@/constants/booking';
import type { Booking, BookingDraft } from '@/models/booking';
import {
  STORAGE_KEYS,
  getConflictCache,
  isSeeded,
  markSeeded,
  readCollection,
  setConflictCache,
  writeCollection,
} from '@/utils/storage';
import { findRoomConflicts, inferBookingStatus } from '@/utils/timeRange';

export async function ensureBookingsSeeded(): Promise<Booking[]> {
  const seeded = await isSeeded();
  const existingBookings = await readCollection<Booking[]>(STORAGE_KEYS.bookings, []);

  if (!seeded || existingBookings.length === 0) {
    await writeCollection(STORAGE_KEYS.bookings, seedBookings);
    await markSeeded();
    return seedBookings;
  }

  return existingBookings;
}

export async function getBookings(): Promise<Booking[]> {
  await ensureBookingsSeeded();
  const bookings = await readCollection<Booking[]>(STORAGE_KEYS.bookings, seedBookings);
  return bookings.map((booking) => ({ ...booking, status: inferBookingStatus(booking) }));
}

export async function createBooking(draft: BookingDraft): Promise<Booking> {
  const bookings = await getBookings();
  const conflicts = findRoomConflicts(bookings, draft.room_id, {
    start: draft.start_time,
    end: draft.end_time,
  });

  await setConflictCache({
    checkedAt: new Date().toISOString(),
    roomId: draft.room_id,
    conflictIds: conflicts.map((item) => item.id),
  });

  if (conflicts.length > 0) {
    throw new Error(conflicts.map((item) => item.title).join('、'));
  }

  const nextBooking: Booking = {
    ...draft,
    id: draft.id ?? nanoid('booking'),
    status: BookingStatus.UPCOMING,
    created_at: new Date().toISOString(),
    checked_in: false,
  };
  await writeCollection(STORAGE_KEYS.bookings, [nextBooking, ...bookings]);
  return nextBooking;
}

export async function updateBooking(bookingId: string, patch: Partial<Booking>): Promise<Booking[]> {
  const bookings = await getBookings();
  const nextBookings = bookings.map((booking) => (booking.id === bookingId ? { ...booking, ...patch } : booking));
  return writeCollection(STORAGE_KEYS.bookings, nextBookings);
}

export async function cancelBooking(bookingId: string): Promise<Booking[]> {
  return updateBooking(bookingId, { status: BookingStatus.CANCELLED });
}

export async function checkInBooking(bookingId: string): Promise<Booking[]> {
  return updateBooking(bookingId, { checked_in: true, status: BookingStatus.ONGOING });
}

export async function getLatestConflictCache(): Promise<{ checkedAt?: string; roomId?: string; conflictIds: string[] }> {
  return getConflictCache({ conflictIds: [] });
}
