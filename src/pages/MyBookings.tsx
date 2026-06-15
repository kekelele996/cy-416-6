import { Button, Form, Input, Modal, Space, Table, Tabs, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { BookingTimeline } from '@/components/common/BookingTimeline';
import { EmptyState } from '@/components/common/EmptyState';
import { BOOKING_MUTABLE_STATUSES } from '@/constants/booking';
import type { Booking } from '@/models/booking';
import { useAuth } from '@/hooks/useAuth';
import { useBookingStore } from '@/stores/bookingStore';
import { useRoomStore } from '@/stores/roomStore';
import { formatBookingStatus, formatTimeRange, getBookingStatusColor } from '@/utils/formatters';
import { normalizeAttendees } from '@/utils/validators';

export function MyBookings() {
  const rooms = useRoomStore((state) => state.rooms);
  const bookings = useBookingStore((state) => state.bookings);
  const cancel = useBookingStore((state) => state.cancel);
  const checkIn = useBookingStore((state) => state.checkIn);
  const edit = useBookingStore((state) => state.edit);
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState<Booking | undefined>();
  const [form] = Form.useForm<{ title: string; attendees: string }>();
  const roomMap = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms]);

  const owned = bookings.filter((booking) => booking.user_id === currentUser?.id);
  const joined = bookings.filter((booking) => booking.attendees.includes(currentUser?.name ?? ''));
  const timelineBookings = useMemo(
    () => Array.from(new Map([...owned, ...joined].map((booking) => [booking.id, booking])).values()).slice(0, 8),
    [joined, owned],
  );

  const openEdit = (booking: Booking) => {
    setEditing(booking);
    form.setFieldsValue({
      title: booking.title,
      attendees: booking.attendees.join('\n'),
    });
  };

  const columns = [
    {
      title: '会议',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Booking) => (
        <div>
          <Typography.Text strong>{title}</Typography.Text>
          <div className="text-xs text-[var(--rf-muted)]">{roomMap.get(record.room_id)?.name ?? '未知会议室'}</div>
        </div>
      ),
    },
    {
      title: '时间',
      key: 'time',
      render: (_: unknown, record: Booking) => formatTimeRange(record.start_time, record.end_time),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: Booking['status']) => <Tag color={getBookingStatusColor(status)}>{formatBookingStatus(status)}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Booking) => (
        <Space wrap>
          <Button size="small" disabled={!BOOKING_MUTABLE_STATUSES.includes(record.status)} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button size="small" onClick={() => checkIn(record.id)} disabled={record.checked_in}>
            签到
          </Button>
          <Button danger size="small" disabled={!BOOKING_MUTABLE_STATUSES.includes(record.status)} onClick={() => cancel(record.id)}>
            取消
          </Button>
        </Space>
      ),
    },
  ];

  const tableFor = (items: Booking[]) =>
    items.length ? (
      <Table rowKey="id" columns={columns} dataSource={items} pagination={{ pageSize: 6 }} />
    ) : (
      <EmptyState title="暂无会议" description="创建或加入会议后会显示在这里" />
    );

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <Typography.Title level={2} className="!m-0">
            我的会议
          </Typography.Title>
          <Typography.Paragraph className="!m-0 text-[var(--rf-muted)]">
            查看、编辑、取消和签到会议
          </Typography.Paragraph>
        </div>
      </div>

      <div className="booking-layout">
        <section className="surface-panel">
          <Tabs
            items={[
              { key: 'owned', label: '我创建的', children: tableFor(owned) },
              { key: 'joined', label: '我参与的', children: tableFor(joined) },
            ]}
          />
        </section>
        <section className="surface-panel">
          <BookingTimeline title="近期会议时间轴" bookings={timelineBookings} rooms={rooms} />
        </section>
      </div>

      <Modal
        title="编辑会议"
        open={Boolean(editing)}
        onCancel={() => setEditing(undefined)}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (!editing) {
              return;
            }
            await edit(editing.id, {
              title: values.title,
              attendees: normalizeAttendees(values.attendees),
            });
            setEditing(undefined);
          }}
        >
          <Form.Item name="title" label="会议主题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="attendees" label="参会人" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
