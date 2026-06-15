import { BookingStatus } from './booking';
import { RoomStatus } from './room';

export const PAGE_MESSAGES = {
  dashboardTitle: '今日会议室运行总览',
  dashboardSubtitle: '查看使用率、今日会议与快速预约入口',
  roomsTitle: '会议室列表',
  bookingTitle: '新建会议预约',
  myBookingsTitle: '我的会议',
  adminRoomsTitle: '会议室管理',
  adminOnly: '当前页面仅管理员可访问',
};

export const FORM_MESSAGES = {
  required: '该字段不能为空',
  invalidEmail: '请输入有效邮箱',
  attendeesRequired: '至少填写一位参会人',
  startBeforeEnd: '结束时间必须晚于开始时间',
  roomUnavailable: '该会议室当前状态不允许预约',
  duplicatedRoomName: '会议室名称已存在',
};

export const STORAGE_MESSAGES = {
  bootstrapped: '本地数据已准备',
  writeFailed: '本地存储写入失败',
  readFailed: '本地存储读取失败',
  resetCompleted: '示例数据已重置',
};

export const CONFLICT_MESSAGES = {
  conflictFound: '该会议室在所选时间段已有会议',
  noConflict: '时间段可预约',
  overlapPrefix: '冲突会议',
  cancelledIgnored: `状态为 ${BookingStatus.CANCELLED} 的会议不参与冲突检测`,
};

export const ROOM_STATUS_MESSAGES: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: '会议室开放预约',
  [RoomStatus.MAINTENANCE]: '维护中，请安排其他会议室',
  [RoomStatus.DISABLED]: '已停用，管理员需重新启用后才可预约',
};

export const BOOKING_STATUS_MESSAGES: Record<BookingStatus, string> = {
  [BookingStatus.UPCOMING]: '会议待开始，可编辑或取消',
  [BookingStatus.ONGOING]: '会议进行中，可签到',
  [BookingStatus.ENDED]: '会议已结束，仅供回顾',
  [BookingStatus.CANCELLED]: '会议已取消，不占用会议室',
};
