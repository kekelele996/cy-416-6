import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { PAGE_MESSAGES } from '@/constants/messages';
import { AdminRooms } from '@/pages/AdminRooms';
import { Booking } from '@/pages/Booking';
import { Dashboard } from '@/pages/Dashboard';
import { MyBookings } from '@/pages/MyBookings';
import { Rooms } from '@/pages/Rooms';
import { useAuthStore } from '@/stores/authStore';
import type { RouteMeta } from '@/types/router';
import { roomflowMessage } from '@/utils/message';
import { canActivateRoute } from './guards';

export interface AppRoute {
  path: string;
  element: ReactNode;
  meta: RouteMeta;
}

export const appRoutes: AppRoute[] = [
  {
    path: '/dashboard',
    element: <Dashboard />,
    meta: { title: PAGE_MESSAGES.dashboardTitle },
  },
  {
    path: '/rooms',
    element: <Rooms />,
    meta: { title: PAGE_MESSAGES.roomsTitle },
  },
  {
    path: '/booking',
    element: <Booking />,
    meta: { title: PAGE_MESSAGES.bookingTitle },
  },
  {
    path: '/my-bookings',
    element: <MyBookings />,
    meta: { title: PAGE_MESSAGES.myBookingsTitle },
  },
  {
    path: '/admin/rooms',
    element: <AdminRooms />,
    meta: { title: PAGE_MESSAGES.adminRoomsTitle, requiresAdmin: true },
  },
];

export function GuardedRoute({ route }: { route: AppRoute }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const location = useLocation();
  const result = canActivateRoute(route.meta, currentUser);

  if (!result.allowed) {
    if (result.reason) {
      roomflowMessage.warning(result.reason);
    }
    return <Navigate to={result.redirectTo ?? '/dashboard'} replace state={{ from: location.pathname }} />;
  }

  return <>{route.element}</>;
}

export function RootRedirect() {
  return <Navigate to="/dashboard" replace />;
}

export function AppOutlet() {
  return <Outlet />;
}
