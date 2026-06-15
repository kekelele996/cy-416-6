import { seedUsers } from '@/api/seed';
import type { User, UserProfilePatch } from '@/models/user';
import { STORAGE_KEYS, isSeeded, markSeeded, readCollection, writeCollection } from '@/utils/storage';

export async function ensureUsersSeeded(): Promise<User[]> {
  const seeded = await isSeeded();
  const existingUsers = await readCollection<User[]>(STORAGE_KEYS.users, []);

  if (!seeded || existingUsers.length === 0) {
    await writeCollection(STORAGE_KEYS.users, seedUsers);
    await writeCollection(STORAGE_KEYS.authUserId, seedUsers[0].id);
    await markSeeded();
    return seedUsers;
  }

  return existingUsers;
}

export async function getUsers(): Promise<User[]> {
  await ensureUsersSeeded();
  return readCollection<User[]>(STORAGE_KEYS.users, seedUsers);
}

export async function getCurrentUser(): Promise<User> {
  const users = await getUsers();
  const authUserId = await readCollection<string>(STORAGE_KEYS.authUserId, users[0].id);
  return users.find((user) => user.id === authUserId) ?? users[0];
}

export async function loginAsUser(userId: string): Promise<User> {
  const users = await getUsers();
  const nextUser = users.find((user) => user.id === userId) ?? users[0];
  await writeCollection(STORAGE_KEYS.authUserId, nextUser.id);
  return nextUser;
}

export async function updateUserProfile(userId: string, patch: UserProfilePatch): Promise<User> {
  const users = await getUsers();
  const nextUsers = users.map((user) => (user.id === userId ? { ...user, ...patch } : user));
  await writeCollection(STORAGE_KEYS.users, nextUsers);
  return nextUsers.find((user) => user.id === userId) ?? nextUsers[0];
}
