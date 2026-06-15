import type { BookingStatus } from '@/constants/booking';
import type { RoomStatus } from '@/constants/room';

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

export interface StatusSummary {
  roomStatus: RoomStatus;
  bookingStatus?: BookingStatus;
  label: string;
  color: string;
}

export interface ApiResult<T> {
  data: T;
  updatedAt: string;
}
