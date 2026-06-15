import dayjs, { Dayjs } from 'dayjs';
import { Alert, DatePicker, Select, Space, Typography } from 'antd';
import { useMemo } from 'react';
import { CONFLICT_MESSAGES } from '@/constants/messages';
import type { Booking } from '@/models/booking';
import type { Room } from '@/models/room';
import { generateTimeSlots, toIsoFromDateAndTime, findRoomConflicts } from '@/utils/timeRange';

interface TimeSlotPickerProps {
  room?: Room;
  bookings: Booking[];
  date: Dayjs;
  startTime?: string;
  endTime?: string;
  onDateChange: (date: Dayjs) => void;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
}

export function TimeSlotPicker({
  room,
  bookings,
  date,
  startTime,
  endTime,
  onDateChange,
  onStartChange,
  onEndChange,
}: TimeSlotPickerProps) {
  const slots = useMemo(() => generateTimeSlots(room?.open_time, room?.close_time), [room?.open_time, room?.close_time]);
  const conflict = useMemo(() => {
    if (!room || !startTime || !endTime) {
      return null;
    }

    return findRoomConflicts(bookings, room.id, {
      start: toIsoFromDateAndTime(date, startTime),
      end: toIsoFromDateAndTime(date, endTime),
    });
  }, [bookings, date, endTime, room, startTime]);

  const slotOptions = slots.map((slot) => ({ label: slot, value: slot }));

  return (
    <div className="time-slot-picker">
      <Space direction="vertical" size={12} className="w-full">
        <div className="grid gap-3 md:grid-cols-3">
          <DatePicker
            className="w-full"
            value={date}
            disabledDate={(current) => current.isBefore(dayjs().subtract(1, 'day'))}
            onChange={(nextDate) => nextDate && onDateChange(nextDate)}
          />
          <Select placeholder="开始时间" value={startTime} options={slotOptions} onChange={onStartChange} />
          <Select placeholder="结束时间" value={endTime} options={slotOptions} onChange={onEndChange} />
        </div>
        {room && (
          <Typography.Text type="secondary">
            开放时间：{room.open_time} - {room.close_time}
          </Typography.Text>
        )}
        {conflict && startTime && endTime && (
          <Alert
            showIcon
            type={conflict.length > 0 ? 'warning' : 'success'}
            message={
              conflict.length > 0
                ? `${CONFLICT_MESSAGES.conflictFound}：${conflict.map((booking) => booking.title).join('、')}`
                : CONFLICT_MESSAGES.noConflict
            }
          />
        )}
      </Space>
    </div>
  );
}
