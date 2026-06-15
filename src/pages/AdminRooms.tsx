import { Button, Drawer, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import { EquipmentTag } from '@/components/common/EquipmentTag';
import { RoomForm } from '@/components/common/RoomForm';
import { RoomStatus } from '@/constants/room';
import type { Room } from '@/models/room';
import { useRoomStore } from '@/stores/roomStore';
import { formatCapacity, formatRoomStatus, getRoomStatusColor } from '@/utils/formatters';

export function AdminRooms() {
  const rooms = useRoomStore((state) => state.rooms);
  const loading = useRoomStore((state) => state.loading);
  const saveRoom = useRoomStore((state) => state.saveRoom);
  const setRoomStatus = useRoomStore((state) => state.setRoomStatus);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <Typography.Title level={2} className="!m-0">
            会议室管理
          </Typography.Title>
          <Typography.Paragraph className="!m-0 text-[var(--rf-muted)]">
            维护设备、开放时间与会议室状态
          </Typography.Paragraph>
        </div>
        <Button
          type="primary"
          onClick={() => {
            setEditingRoom(undefined);
            setDrawerOpen(true);
          }}
        >
          新增会议室
        </Button>
      </div>

      <section className="surface-panel">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rooms}
          pagination={false}
          columns={[
            {
              title: '会议室',
              key: 'room',
              render: (_: unknown, record: Room) => (
                <div>
                  <Typography.Text strong>{record.name}</Typography.Text>
                  <div className="text-xs text-[var(--rf-muted)]">
                    {record.floor} · {formatCapacity(record.capacity)}
                  </div>
                </div>
              ),
            },
            {
              title: '设备',
              dataIndex: 'equipment',
              key: 'equipment',
              render: (equipment: Room['equipment']) => (
                <Space size={[4, 4]} wrap>
                  {equipment.map((item) => (
                    <EquipmentTag equipment={item} key={item} />
                  ))}
                </Space>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              render: (status: RoomStatus) => <Tag color={getRoomStatusColor(status)}>{formatRoomStatus(status)}</Tag>,
            },
            {
              title: '开放时间',
              key: 'open',
              render: (_: unknown, record: Room) => `${record.open_time} - ${record.close_time}`,
            },
            {
              title: '操作',
              key: 'action',
              render: (_: unknown, record: Room) => (
                <Space wrap>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingRoom(record);
                      setDrawerOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      setRoomStatus(
                        record.id,
                        record.status === RoomStatus.MAINTENANCE ? RoomStatus.AVAILABLE : RoomStatus.MAINTENANCE,
                      )
                    }
                  >
                    {record.status === RoomStatus.MAINTENANCE ? '恢复可用' : '设为维护'}
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() =>
                      setRoomStatus(
                        record.id,
                        record.status === RoomStatus.DISABLED ? RoomStatus.AVAILABLE : RoomStatus.DISABLED,
                      )
                    }
                  >
                    {record.status === RoomStatus.DISABLED ? '启用' : '停用'}
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </section>

      <Drawer
        width={520}
        title={editingRoom ? `编辑 ${editingRoom.name}` : '新增会议室'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <RoomForm
          room={editingRoom}
          submitting={loading}
          onSubmit={async (draft) => {
            await saveRoom(draft);
            setDrawerOpen(false);
          }}
          onCancel={() => setDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
}
