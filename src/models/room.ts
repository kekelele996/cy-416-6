import { RoomEquipment, RoomStatus } from '@/constants/room';

export interface Room {
  id: string;
  name: string;
  floor: string;
  capacity: number;
  equipment: RoomEquipment[];
  status: RoomStatus;
  images: string[];
  open_time: string;
  close_time: string;
}

export type RoomDraft = Omit<Room, 'id' | 'images'> & {
  id?: string;
  images?: string[];
};
