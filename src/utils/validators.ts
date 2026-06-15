import dayjs from 'dayjs';
import { FORM_MESSAGES } from '@/constants/messages';
import { RoomStatus } from '@/constants/room';
import type { Room } from '@/models/room';

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateTimeRange(start: string, end: string): string | null {
  if (!start || !end) {
    return FORM_MESSAGES.required;
  }
  if (!dayjs(end).isAfter(dayjs(start))) {
    return FORM_MESSAGES.startBeforeEnd;
  }
  return null;
}

export function assertRoomBookable(room?: Room): string | null {
  if (!room) {
    return FORM_MESSAGES.required;
  }
  if (room.status !== RoomStatus.AVAILABLE) {
    return FORM_MESSAGES.roomUnavailable;
  }
  return null;
}

export function normalizeAttendees(raw: string | string[]): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => item.trim()).filter(Boolean);
  }

  return raw
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateAttendees(attendees: string[]): string | null {
  return attendees.length > 0 ? null : FORM_MESSAGES.attendeesRequired;
}
