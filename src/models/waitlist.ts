export enum WaitlistStatus {
  PENDING = 'pending',
  CONVERTED = 'converted',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface Waitlist {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  attendees: string[];
  start_time: string;
  end_time: string;
  status: WaitlistStatus;
  queue_position: number;
  converted_booking_id?: string;
  created_at: string;
  notified_at?: string;
}

export type WaitlistDraft = Omit<Waitlist, 'id' | 'status' | 'queue_position' | 'created_at'> & {
  id?: string;
};
