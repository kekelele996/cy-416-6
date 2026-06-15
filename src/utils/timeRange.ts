import dayjs, { Dayjs } from 'dayjs';
import { BookingStatus } from '@/constants/booking';
import type { Booking } from '@/models/booking';

export interface TimeRange {
  start: string;
  end: string;
}

export function toIsoFromDateAndTime(date: Dayjs, time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  return date.hour(hour).minute(minute).second(0).millisecond(0).toISOString();
}

export function formatClock(value: string): string {
  return dayjs(value).format('HH:mm');
}

export function generateTimeSlots(openTime = '08:00', closeTime = '20:00', intervalMinutes = 30): string[] {
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  const slots: string[] = [];
  let cursor = dayjs().hour(openHour).minute(openMinute).second(0).millisecond(0);
  const end = dayjs().hour(closeHour).minute(closeMinute).second(0).millisecond(0);

  while (cursor.isBefore(end) || cursor.isSame(end)) {
    slots.push(cursor.format('HH:mm'));
    cursor = cursor.add(intervalMinutes, 'minute');
  }

  return slots;
}

export function doesTimeOverlap(left: TimeRange, right: TimeRange): boolean {
  const leftStart = dayjs(left.start);
  const leftEnd = dayjs(left.end);
  const rightStart = dayjs(right.start);
  const rightEnd = dayjs(right.end);
  return leftStart.isBefore(rightEnd) && leftEnd.isAfter(rightStart);
}

export function inferBookingStatus(booking: Pick<Booking, 'start_time' | 'end_time' | 'status'>): BookingStatus {
  if (booking.status === BookingStatus.CANCELLED) {
    return BookingStatus.CANCELLED;
  }

  const now = dayjs();
  if (now.isBefore(dayjs(booking.start_time))) {
    return BookingStatus.UPCOMING;
  }
  if (now.isAfter(dayjs(booking.end_time))) {
    return BookingStatus.ENDED;
  }
  return BookingStatus.ONGOING;
}

export function findRoomConflicts(
  bookings: Booking[],
  roomId: string,
  range: TimeRange,
  ignoreBookingId?: string,
): Booking[] {
  return bookings.filter((booking) => {
    if (booking.id === ignoreBookingId) {
      return false;
    }
    if (booking.room_id !== roomId) {
      return false;
    }
    if (booking.status === BookingStatus.CANCELLED) {
      return false;
    }
    return doesTimeOverlap(range, {
      start: booking.start_time,
      end: booking.end_time,
    });
  });
}

export function isSameDay(value: string, base = dayjs()): boolean {
  return dayjs(value).isSame(base, 'day');
}

export function sortByStartTime<T extends Pick<Booking, 'start_time'>>(items: T[]): T[] {
  return [...items].sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf());
}
