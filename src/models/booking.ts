import { BookingStatus } from '@/constants/booking';

export interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  attendees: string[];
  start_time: string;
  end_time: string;
  status: BookingStatus;
  created_at: string;
  checked_in?: boolean;
}

export type BookingDraft = Omit<Booking, 'id' | 'status' | 'created_at' | 'checked_in'> & {
  id?: string;
};
