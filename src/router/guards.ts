import { PAGE_MESSAGES } from '@/constants/messages';
import { RoomStatus } from '@/constants/room';
import { BookingStatus } from '@/constants/booking';
import { UserRole, type User } from '@/models/user';
import type { RouteMeta, GuardResult } from '@/types/router';

export function canActivateRoute(meta: RouteMeta, user?: User): GuardResult {
  if (meta.requiresAdmin && user?.role !== UserRole.ADMIN) {
    return {
      allowed: false,
      redirectTo: '/dashboard',
      reason: PAGE_MESSAGES.adminOnly,
    };
  }

  return { allowed: true };
}

export const routeStatusVocabulary = {
  adminRoomStatuses: [RoomStatus.AVAILABLE, RoomStatus.MAINTENANCE, RoomStatus.DISABLED],
  visibleBookingStatuses: [BookingStatus.UPCOMING, BookingStatus.ONGOING, BookingStatus.ENDED, BookingStatus.CANCELLED],
};
