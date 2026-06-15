import { nanoid } from '@/api/id';
import { seedRooms } from '@/api/seed';
import { RoomStatus } from '@/constants/room';
import type { Room, RoomDraft } from '@/models/room';
import { STORAGE_KEYS, isSeeded, markSeeded, readCollection, writeCollection } from '@/utils/storage';

export async function ensureRoomsSeeded(): Promise<Room[]> {
  const seeded = await isSeeded();
  const existingRooms = await readCollection<Room[]>(STORAGE_KEYS.rooms, []);

  if (!seeded || existingRooms.length === 0) {
    await writeCollection(STORAGE_KEYS.rooms, seedRooms);
    await markSeeded();
    return seedRooms;
  }

  return existingRooms;
}

export async function getRooms(): Promise<Room[]> {
  await ensureRoomsSeeded();
  return readCollection<Room[]>(STORAGE_KEYS.rooms, seedRooms);
}

export async function upsertRoom(draft: RoomDraft): Promise<Room> {
  const rooms = await getRooms();
  const nextRoom: Room = {
    id: draft.id ?? nanoid('room'),
    name: draft.name,
    floor: draft.floor,
    capacity: draft.capacity,
    equipment: draft.equipment,
    status: draft.status,
    images: draft.images?.length ? draft.images : ['linear-gradient(135deg, #dbe7db, #f1e4c2)'],
    open_time: draft.open_time,
    close_time: draft.close_time,
  };

  const exists = rooms.some((room) => room.id === nextRoom.id);
  const nextRooms = exists ? rooms.map((room) => (room.id === nextRoom.id ? nextRoom : room)) : [nextRoom, ...rooms];
  await writeCollection(STORAGE_KEYS.rooms, nextRooms);
  return nextRoom;
}

export async function updateRoomStatus(roomId: string, status: RoomStatus): Promise<Room[]> {
  const rooms = await getRooms();
  const nextRooms = rooms.map((room) => (room.id === roomId ? { ...room, status } : room));
  return writeCollection(STORAGE_KEYS.rooms, nextRooms);
}

export async function deleteRoom(roomId: string): Promise<Room[]> {
  const rooms = await getRooms();
  const nextRooms = rooms.filter((room) => room.id !== roomId);
  return writeCollection(STORAGE_KEYS.rooms, nextRooms);
}
