import { nanoid } from '@/api/id';
import { NotificationType, type Notification, type NotificationDraft } from '@/models/notification';
import { STORAGE_KEYS, readCollection, writeCollection } from '@/utils/storage';

export async function getNotifications(): Promise<Notification[]> {
  return readCollection<Notification[]>(STORAGE_KEYS.notifications, []);
}

export async function getUserNotifications(
  userId: string,
  includeDismissed = false,
): Promise<Notification[]> {
  const all = await getNotifications();
  return all.filter((n) => n.user_id === userId && (includeDismissed || !n.dismissed));
}

export async function createNotification(draft: NotificationDraft): Promise<Notification> {
  const notifications = await getNotifications();
  const nextNotification: Notification = {
    ...draft,
    id: draft.id ?? nanoid('notif'),
    read: false,
    dismissed: false,
    created_at: new Date().toISOString(),
  };
  await writeCollection(STORAGE_KEYS.notifications, [nextNotification, ...notifications]);
  return nextNotification;
}

export async function markNotificationRead(notificationId: string): Promise<Notification[]> {
  const notifications = await getNotifications();
  const updated = notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n,
  );
  return writeCollection(STORAGE_KEYS.notifications, updated);
}

export async function markAllUserNotificationsRead(userId: string): Promise<Notification[]> {
  const notifications = await getNotifications();
  const updated = notifications.map((n) =>
    n.user_id === userId && !n.read ? { ...n, read: true, read_at: new Date().toISOString() } : n,
  );
  return writeCollection(STORAGE_KEYS.notifications, updated);
}

export async function dismissNotification(notificationId: string): Promise<Notification[]> {
  const notifications = await getNotifications();
  const updated = notifications.map((n) =>
    n.id === notificationId ? { ...n, dismissed: true, dismissed_at: new Date().toISOString() } : n,
  );
  return writeCollection(STORAGE_KEYS.notifications, updated);
}

export async function clearNotification(notificationId: string): Promise<Notification[]> {
  return dismissNotification(notificationId);
}

export async function clearAllUserNotifications(userId: string): Promise<Notification[]> {
  const notifications = await getNotifications();
  const updated = notifications.map((n) =>
    n.user_id === userId ? { ...n, dismissed: true, dismissed_at: new Date().toISOString() } : n,
  );
  return writeCollection(STORAGE_KEYS.notifications, updated);
}

export async function createWaitlistConvertedNotification(params: {
  userId: string;
  bookingId: string;
  waitlistId: string;
  title: string;
  description: string;
}): Promise<Notification> {
  const existing = await getUserNotifications(params.userId, true);
  const duplicate = existing.find(
    (n) =>
      n.type === NotificationType.WAITLIST_CONVERTED &&
      n.booking_id === params.bookingId &&
      n.waitlist_id === params.waitlistId,
  );
  if (duplicate) {
    return duplicate;
  }

  return createNotification({
    user_id: params.userId,
    type: NotificationType.WAITLIST_CONVERTED,
    title: params.title,
    description: params.description,
    booking_id: params.bookingId,
    waitlist_id: params.waitlistId,
  });
}
