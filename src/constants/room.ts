export enum RoomStatus {
  AVAILABLE = 'available',
  MAINTENANCE = 'maintenance',
  DISABLED = 'disabled',
}

export enum RoomEquipment {
  PROJECTOR = 'projector',
  WHITEBOARD = 'whiteboard',
  VIDEO = 'video',
  PHONE = 'phone',
}

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: '可用',
  [RoomStatus.MAINTENANCE]: '维护中',
  [RoomStatus.DISABLED]: '已停用',
};

export const ROOM_STATUS_COLORS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: 'green',
  [RoomStatus.MAINTENANCE]: 'gold',
  [RoomStatus.DISABLED]: 'red',
};

export const ROOM_STATUS_CARD_HINTS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: '当前可接受预约',
  [RoomStatus.MAINTENANCE]: '维护窗口内不可预约',
  [RoomStatus.DISABLED]: '已从预约流中隐藏',
};

export const EQUIPMENT_LABELS: Record<RoomEquipment, string> = {
  [RoomEquipment.PROJECTOR]: '投影仪',
  [RoomEquipment.WHITEBOARD]: '白板',
  [RoomEquipment.VIDEO]: '视频会议',
  [RoomEquipment.PHONE]: '电话',
};

export const EQUIPMENT_COLORS: Record<RoomEquipment, string> = {
  [RoomEquipment.PROJECTOR]: 'blue',
  [RoomEquipment.WHITEBOARD]: 'cyan',
  [RoomEquipment.VIDEO]: 'purple',
  [RoomEquipment.PHONE]: 'volcano',
};

export const ROOM_FLOORS = ['12F', '15F', '18F', '22F'];

export const ROOM_CAPACITY_OPTIONS = [
  { label: '1-6 人', min: 1, max: 6 },
  { label: '7-12 人', min: 7, max: 12 },
  { label: '13-20 人', min: 13, max: 20 },
  { label: '20 人以上', min: 21, max: 99 },
];
