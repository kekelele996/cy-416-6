import dayjs, { Dayjs } from 'dayjs';
import { Alert, Button, Form, Input, Select, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EquipmentTag } from '@/components/common/EquipmentTag';
import { TimeSlotPicker } from '@/components/common/TimeSlotPicker';
import { FORM_MESSAGES } from '@/constants/messages';
import { RoomStatus } from '@/constants/room';
import { useAuth } from '@/hooks/useAuth';
import { useTimeConflict } from '@/hooks/useTimeConflict';
import type { BookingDraft } from '@/models/booking';
import { useBookingStore } from '@/stores/bookingStore';
import { useRoomStore } from '@/stores/roomStore';
import { formatRoomStatus } from '@/utils/formatters';
import { toIsoFromDateAndTime } from '@/utils/timeRange';
import { assertRoomBookable, normalizeAttendees, validateAttendees, validateTimeRange } from '@/utils/validators';

interface BookingFormValues {
  room_id: string;
  title: string;
  attendees: string;
}

export function Booking() {
  const [form] = Form.useForm<BookingFormValues>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rooms = useRoomStore((state) => state.rooms);
  const bookings = useBookingStore((state) => state.bookings);
  const createBooking = useBookingStore((state) => state.create);
  const loading = useBookingStore((state) => state.loading);
  const { currentUser } = useAuth();
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const selectedRoomId = Form.useWatch('room_id', form);
  const selectedRoom = useMemo(() => rooms.find((room) => room.id === selectedRoomId), [rooms, selectedRoomId]);

  useEffect(() => {
    const roomId = searchParams.get('roomId');
    const fallbackRoom = rooms.find((room) => room.status === RoomStatus.AVAILABLE);
    if (roomId || fallbackRoom) {
      form.setFieldValue('room_id', roomId ?? fallbackRoom?.id);
    }
  }, [form, rooms, searchParams]);

  const draftPreview = useMemo<Partial<BookingDraft>>(
    () => ({
      room_id: selectedRoomId,
      user_id: currentUser?.id,
      start_time: startTime ? toIsoFromDateAndTime(date, startTime) : undefined,
      end_time: endTime ? toIsoFromDateAndTime(date, endTime) : undefined,
    }),
    [currentUser?.id, date, endTime, selectedRoomId, startTime],
  );
  const conflict = useTimeConflict(draftPreview);

  const onFinish = async (values: BookingFormValues) => {
    const attendees = normalizeAttendees(values.attendees);
    const start = toIsoFromDateAndTime(date, startTime);
    const end = toIsoFromDateAndTime(date, endTime);
    const timeError = validateTimeRange(start, end);
    const roomError = assertRoomBookable(selectedRoom);
    const attendeesError = validateAttendees(attendees);

    if (timeError || roomError || attendeesError || !currentUser) {
      form.setFields([
        ...(attendeesError ? [{ name: 'attendees' as const, errors: [attendeesError] }] : []),
        ...(roomError ? [{ name: 'room_id' as const, errors: [roomError] }] : []),
      ]);
      return;
    }

    const ok = await createBooking({
      room_id: values.room_id,
      user_id: currentUser.id,
      title: values.title,
      attendees,
      start_time: start,
      end_time: end,
    });

    if (ok) {
      navigate('/my-bookings');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <Typography.Title level={2} className="!m-0">
            会议预约
          </Typography.Title>
          <Typography.Paragraph className="!m-0 text-[var(--rf-muted)]">
            选择会议室、时间段与参会人
          </Typography.Paragraph>
        </div>
      </div>

      <div className="booking-layout">
        <section className="surface-panel">
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item name="room_id" label="会议室" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
              <Select
                placeholder="选择会议室"
                options={rooms.map((room) => ({
                  label: `${room.name} · ${room.floor} · ${formatRoomStatus(room.status)}`,
                  value: room.id,
                  disabled: room.status !== RoomStatus.AVAILABLE,
                }))}
              />
            </Form.Item>

            {selectedRoom && (
              <div className="mb-4 rounded-md border border-[var(--rf-border)] p-3">
                <Space wrap>
                  {selectedRoom.equipment.map((equipment) => (
                    <EquipmentTag key={equipment} equipment={equipment} />
                  ))}
                </Space>
                <div className="mt-2 text-sm text-[var(--rf-muted)]">
                  容量 {selectedRoom.capacity} 人 · {selectedRoom.open_time} - {selectedRoom.close_time}
                </div>
              </div>
            )}

            <Form.Item label="时间段" required>
              <TimeSlotPicker
                room={selectedRoom}
                bookings={bookings}
                date={date}
                startTime={startTime}
                endTime={endTime}
                onDateChange={setDate}
                onStartChange={setStartTime}
                onEndChange={setEndTime}
              />
            </Form.Item>

            {selectedRoomId && (
              <Alert
                className="mb-4"
                type={conflict.hasConflict ? 'warning' : 'success'}
                showIcon
                message={conflict.message}
              />
            )}

            <Form.Item name="title" label="会议主题" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
              <Input placeholder="如 版本评审" />
            </Form.Item>
            <Form.Item name="attendees" label="参会人" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
              <Input.TextArea rows={4} placeholder="用逗号或换行分隔" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} disabled={conflict.hasConflict}>
              提交预约
            </Button>
          </Form>
        </section>

        <aside className="surface-panel">
          <Typography.Title level={4}>所选会议室日程</Typography.Title>
          <div className="stack-list">
            {bookings
              .filter((booking) => booking.room_id === selectedRoomId)
              .slice(0, 6)
              .map((booking) => (
                <div className="compact-row" key={booking.id}>
                  <span>{booking.title}</span>
                  <span>{dayjs(booking.start_time).format('MM-DD HH:mm')}</span>
                </div>
              ))}
            {!selectedRoomId && <Typography.Text type="secondary">请选择会议室</Typography.Text>}
          </div>
        </aside>
      </div>
    </div>
  );
}
