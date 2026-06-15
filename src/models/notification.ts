export enum NotificationType {
  WAITLIST_CONVERTED = 'waitlist_converted',
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  description: string;
  booking_id?: string;
  waitlist_id?: string;
  read: boolean;
  created_at: string;
  read_at?: string;
}

export type NotificationDraft = Omit<Notification, 'id' | 'read' | 'created_at'> & {
  id?: string;
};
