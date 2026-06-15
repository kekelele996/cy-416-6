import { FilterOutlined } from '@ant-design/icons';
import { Button, Drawer, Select, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EquipmentTag } from '@/components/common/EquipmentTag';
import { EmptyState } from '@/components/common/EmptyState';
import { RoomStatusCard } from '@/components/common/RoomStatusCard';
import { EQUIPMENT_LABELS, ROOM_CAPACITY_OPTIONS, ROOM_FLOORS, RoomEquipment, RoomStatus } from '@/constants/room';
import type { Room } from '@/models/room';
import { useBookingStore } from '@/stores/bookingStore';
import { useRoomStore } from '@/stores/roomStore';
import { formatCapacity, formatEquipmentList, formatRoomStatus } from '@/utils/formatters';

export function Rooms() {
  const rooms = useRoomStore((state) => state.rooms);
  const bookings = useBookingStore((state) => state.bookings);
  const filters = useRoomStore((state) => state.filters);
  const setFilters = useRoomStore((state) => state.setFilters);
  const [activeRoom, setActiveRoom] = useState<Room | undefined>();

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesFloor = !filters.floor || room.floor === filters.floor;
      const capacityOption = ROOM_CAPACITY_OPTIONS.find((option) => option.label === filters.capacityRange);
      const matchesCapacity =
        !capacityOption || (room.capacity >= capacityOption.min && room.capacity <= capacityOption.max);
      const matchesEquipment =
        !filters.equipment?.length ||
        filters.equipment.every((equipment) => room.equipment.includes(equipment as RoomEquipment));
      const matchesStatus = !filters.status || room.status === filters.status;
      return matchesFloor && matchesCapacity && matchesEquipment && matchesStatus;
    });
  }, [filters.capacityRange, filters.equipment, filters.floor, filters.status, rooms]);

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <Typography.Title level={2} className="!m-0">
            会议室列表
          </Typography.Title>
          <Typography.Paragraph className="!m-0 text-[var(--rf-muted)]">
            按楼层、容量、设备与状态筛选
          </Typography.Paragraph>
        </div>
        <Button icon={<FilterOutlined />} onClick={() => setFilters({})}>
          清空筛选
        </Button>
      </div>

      <div className="filter-bar">
        <Select
          allowClear
          placeholder="楼层"
          value={filters.floor}
          options={ROOM_FLOORS.map((floor) => ({ label: floor, value: floor }))}
          onChange={(floor) => setFilters({ ...filters, floor })}
        />
        <Select
          allowClear
          placeholder="容量"
          value={filters.capacityRange}
          options={ROOM_CAPACITY_OPTIONS.map((option) => ({ label: option.label, value: option.label }))}
          onChange={(capacityRange) => setFilters({ ...filters, capacityRange })}
        />
        <Select
          allowClear
          mode="multiple"
          placeholder="设备"
          value={filters.equipment}
          options={Object.values(RoomEquipment).map((equipment) => ({
            label: EQUIPMENT_LABELS[equipment],
            value: equipment,
          }))}
          onChange={(equipment) => setFilters({ ...filters, equipment })}
        />
        <Select
          allowClear
          placeholder="状态"
          value={filters.status}
          options={Object.values(RoomStatus).map((status) => ({ label: formatRoomStatus(status), value: status }))}
          onChange={(status) => setFilters({ ...filters, status })}
        />
      </div>

      {filteredRooms.length === 0 ? (
        <EmptyState title="没有匹配会议室" description="调整筛选条件后再查看" />
      ) : (
        <div className="room-card-grid">
          {filteredRooms.map((room) => (
            <div key={room.id} className="flex flex-col gap-2">
              <RoomStatusCard room={room} bookings={bookings} />
              <Button onClick={() => setActiveRoom(room)}>查看详情</Button>
            </div>
          ))}
        </div>
      )}

      <Drawer title={activeRoom?.name} open={Boolean(activeRoom)} onClose={() => setActiveRoom(undefined)} width={420}>
        {activeRoom && (
          <Space direction="vertical" size={16} className="w-full">
            <Typography.Text>楼层：{activeRoom.floor}</Typography.Text>
            <Typography.Text>容量：{formatCapacity(activeRoom.capacity)}</Typography.Text>
            <Typography.Text>状态：{formatRoomStatus(activeRoom.status)}</Typography.Text>
            <Typography.Text>开放时间：{activeRoom.open_time} - {activeRoom.close_time}</Typography.Text>
            <Typography.Text>设备：{formatEquipmentList(activeRoom.equipment)}</Typography.Text>
            <Space wrap>
              {activeRoom.equipment.map((equipment) => (
                <EquipmentTag key={equipment} equipment={equipment} />
              ))}
            </Space>
            <Link to={`/booking?roomId=${activeRoom.id}`}>
              <Button type="primary" block disabled={activeRoom.status !== RoomStatus.AVAILABLE}>
                去预约
              </Button>
            </Link>
          </Space>
        )}
      </Drawer>
    </div>
  );
}
