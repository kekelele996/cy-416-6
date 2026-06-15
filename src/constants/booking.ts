export enum BookingStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.UPCOMING]: '待开始',
  [BookingStatus.ONGOING]: '进行中',
  [BookingStatus.ENDED]: '已结束',
  [BookingStatus.CANCELLED]: '已取消',
};

export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.UPCOMING]: 'blue',
  [BookingStatus.ONGOING]: 'green',
  [BookingStatus.ENDED]: 'default',
  [BookingStatus.CANCELLED]: 'red',
};

export const BOOKING_STATUS_ORDER: BookingStatus[] = [
  BookingStatus.ONGOING,
  BookingStatus.UPCOMING,
  BookingStatus.ENDED,
  BookingStatus.CANCELLED,
];

export const BOOKING_MUTABLE_STATUSES = [
  BookingStatus.UPCOMING,
  BookingStatus.ONGOING,
];

export enum WaitlistStatus {
  PENDING = 'pending',
  CONVERTED = 'converted',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export const WAITLIST_STATUS_LABELS: Record<WaitlistStatus, string> = {
  [WaitlistStatus.PENDING]: '候补中',
  [WaitlistStatus.CONVERTED]: '已转正',
  [WaitlistStatus.CANCELLED]: '已取消',
  [WaitlistStatus.EXPIRED]: '已过期',
};

export const WAITLIST_STATUS_COLORS: Record<WaitlistStatus, string> = {
  [WaitlistStatus.PENDING]: 'orange',
  [WaitlistStatus.CONVERTED]: 'green',
  [WaitlistStatus.CANCELLED]: 'red',
  [WaitlistStatus.EXPIRED]: 'default',
};

export const WAITLIST_MUTABLE_STATUSES = [WaitlistStatus.PENDING];

