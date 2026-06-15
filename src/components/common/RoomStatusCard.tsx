import { CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import { Badge, Button, Progress, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ROOM_STATUS_CARD_HINTS, RoomStatus } from '@/constants/room';
import type { Booking } from '@/models/booking';
import type { Room } from '@/models/room';
import { formatCapacity, formatRoomStatus, formatTimeRange, getRoomStatusColor } from '@/utils/formatters';
import { isSameDay } from '@/utils/timeRange';
import { EquipmentTag } from './EquipmentTag';

interface RoomStatusCardProps {
  room: Room;
  bookings: Booking[];
  compact?: boolean;
}

export function RoomStatusCard({ room, bookings, compact = false }: RoomStatusCardProps) {
  const todaysBookings = bookings.filter((booking) => booking.room_id === room.id && isSameDay(booking.start_time));
  const utilization = Math.min(100, Math.round((todaysBookings.length / 6) * 100));
  const isDisabled = room.status !== RoomStatus.AVAILABLE;

  return (
    <article className="room-status-card">
      <div className="room-card-cover" style={{ background: room.images[0] }}>
        <Badge
          color={getRoomStatusColor(room.status)}
          text={<span className="font-medium">{formatRoomStatus(room.status)}</span>}
        />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Typography.Title level={4} className="!m-0 !text-[18px]">
              {room.name}
            </Typography.Title>
            <Typography.Text type="secondary">
              {room.floor} · <TeamOutlined /> {formatCapacity(room.capacity)}
            </Typography.Text>
          </div>
          <Tag color={isDisabled ? 'default' : 'processing'}>{ROOM_STATUS_CARD_HINTS[room.status]}</Tag>
        </div>

        <Space size={[6, 6]} wrap>
          {room.equipment.map((item) => (
            <EquipmentTag equipment={item} key={item} />
          ))}
        </Space>

        {!compact && (
          <div className="rounded-md border border-[var(--rf-border)] p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>今日使用率</span>
              <span className="font-semibold">{utilization}%</span>
            </div>
            <Progress percent={utilization} showInfo={false} strokeColor="#2f5d50" trailColor="var(--rf-progress)" />
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--rf-muted)]">
              <CalendarOutlined />
              <span>
                开放 {room.open_time} - {room.close_time}
              </span>
            </div>
          </div>
        )}

        {todaysBookings[0] ? (
          <Typography.Text className="text-sm" type="secondary">
            下一场：{todaysBookings[0].title} · {formatTimeRange(todaysBookings[0].start_time, todaysBookings[0].end_time)}
          </Typography.Text>
        ) : (
          <Typography.Text className="text-sm" type="secondary">
            今日暂无预约
          </Typography.Text>
        )}

        <Button type="primary" disabled={isDisabled} className="w-full" href={`/booking?roomId=${room.id}`}>
          预约此会议室
        </Button>
        <Link className="sr-only" to={`/booking?roomId=${room.id}`}>
          预约 {room.name}
        </Link>
      </div>
    </article>
  );
}
