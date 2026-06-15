import dayjs from 'dayjs';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS, BookingStatus } from '@/constants/booking';
import {
  EQUIPMENT_LABELS,
  ROOM_STATUS_COLORS,
  ROOM_STATUS_LABELS,
  RoomEquipment,
  RoomStatus,
} from '@/constants/room';

export function formatRoomStatus(status: RoomStatus): string {
  return ROOM_STATUS_LABELS[status] ?? '未知状态';
}

export function getRoomStatusColor(status: RoomStatus): string {
  return ROOM_STATUS_COLORS[status] ?? 'default';
}

export function formatBookingStatus(status: BookingStatus): string {
  return BOOKING_STATUS_LABELS[status] ?? '未知状态';
}

export function getBookingStatusColor(status: BookingStatus): string {
  return BOOKING_STATUS_COLORS[status] ?? 'default';
}

export function formatEquipment(equipment: RoomEquipment): string {
  return EQUIPMENT_LABELS[equipment] ?? equipment;
}

export function formatEquipmentList(equipment: RoomEquipment[]): string {
  return equipment.map(formatEquipment).join('、');
}

export function formatDepartment(department: string): string {
  const departmentMap: Record<string, string> = {
    product: '产品部',
    design: '设计部',
    engineering: '工程部',
    operations: '运营部',
    finance: '财务部',
  };
  return departmentMap[department] ?? department;
}

export function formatDateTime(value: string): string {
  return dayjs(value).format('MM月DD日 HH:mm');
}

export function formatDate(value: string): string {
  return dayjs(value).format('YYYY-MM-DD');
}

export function formatTimeRange(start: string, end: string): string {
  return `${dayjs(start).format('HH:mm')} - ${dayjs(end).format('HH:mm')}`;
}

export function formatCapacity(capacity: number): string {
  return `${capacity} 人`;
}
