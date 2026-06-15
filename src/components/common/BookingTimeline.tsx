import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Space, Tag, Timeline, Typography } from 'antd';
import { BOOKING_STATUS_MESSAGES, ROOM_STATUS_MESSAGES } from '@/constants/messages';
import { BookingStatus } from '@/constants/booking';
import { RoomStatus } from '@/constants/room';
import type { Booking } from '@/models/booking';
import type { Room } from '@/models/room';
import { formatBookingStatus, formatTimeRange, getBookingStatusColor } from '@/utils/formatters';
import { sortByStartTime } from '@/utils/timeRange';
import { EmptyState } from './EmptyState';

interface BookingTimelineProps {
  bookings: Booking[];
  rooms: Room[];
  title?: string;
  dense?: boolean;
}

export function BookingTimeline({ bookings, rooms, title, dense = false }: BookingTimelineProps) {
  const sorted = sortByStartTime(bookings);
  const roomMap = new Map(rooms.map((room) => [room.id, room]));

  if (sorted.length === 0) {
    return <EmptyState title="没有会议" description="所选范围暂无会议安排" />;
  }

  return (
    <section className="timeline-shell">
      {title && (
        <Typography.Title level={4} className="!mb-4 !text-[18px]">
          {title}
        </Typography.Title>
      )}
      <Timeline
        items={sorted.map((booking) => {
          const room = roomMap.get(booking.room_id);
          const roomStatus = room?.status ?? RoomStatus.DISABLED;
          const isCancelled = booking.status === BookingStatus.CANCELLED;

          return {
            color: getBookingStatusColor(booking.status),
            dot: booking.checked_in ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
            children: (
              <div className={dense ? 'pb-1' : 'pb-3'}>
                <Space size={8} wrap>
                  <Typography.Text strong delete={isCancelled}>
                    {booking.title}
                  </Typography.Text>
                  <Tag color={getBookingStatusColor(booking.status)}>{formatBookingStatus(booking.status)}</Tag>
                </Space>
                <div className="mt-1 text-sm text-[var(--rf-muted)]">
                  {formatTimeRange(booking.start_time, booking.end_time)} · {room?.name ?? '未知会议室'}
                </div>
                {!dense && (
                  <div className="mt-1 text-xs text-[var(--rf-muted)]">
                    {BOOKING_STATUS_MESSAGES[booking.status]} · {ROOM_STATUS_MESSAGES[roomStatus]}
                  </div>
                )}
              </div>
            ),
          };
        })}
      />
    </section>
  );
}
