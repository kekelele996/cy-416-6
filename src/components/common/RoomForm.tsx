import { Button, Form, Input, InputNumber, Select, Space } from 'antd';
import { useEffect } from 'react';
import { FORM_MESSAGES } from '@/constants/messages';
import { EQUIPMENT_LABELS, ROOM_FLOORS, ROOM_STATUS_LABELS, RoomEquipment, RoomStatus } from '@/constants/room';
import type { Room, RoomDraft } from '@/models/room';

interface RoomFormProps {
  room?: Room;
  submitting?: boolean;
  onSubmit: (draft: RoomDraft) => Promise<void> | void;
  onCancel?: () => void;
}

export function RoomForm({ room, submitting = false, onSubmit, onCancel }: RoomFormProps) {
  const [form] = Form.useForm<RoomDraft>();

  useEffect(() => {
    form.setFieldsValue(
      room ?? {
        name: '',
        floor: ROOM_FLOORS[0],
        capacity: 8,
        equipment: [RoomEquipment.WHITEBOARD],
        status: RoomStatus.AVAILABLE,
        open_time: '08:30',
        close_time: '20:00',
        images: [],
      },
    );
  }, [form, room]);

  return (
    <Form layout="vertical" form={form} onFinish={onSubmit} className="room-form">
      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>
      <div className="grid gap-3 md:grid-cols-2">
        <Form.Item label="会议室名称" name="name" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
          <Input placeholder="如 Harbor 港湾" />
        </Form.Item>
        <Form.Item label="楼层" name="floor" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
          <Select options={ROOM_FLOORS.map((floor) => ({ label: floor, value: floor }))} />
        </Form.Item>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Form.Item label="容量" name="capacity" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
          <InputNumber min={1} max={80} className="w-full" />
        </Form.Item>
        <Form.Item label="状态" name="status" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
          <Select
            options={Object.values(RoomStatus).map((status) => ({
              label: ROOM_STATUS_LABELS[status],
              value: status,
            }))}
          />
        </Form.Item>
      </div>

      <Form.Item label="设备" name="equipment" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
        <Select
          mode="multiple"
          options={Object.values(RoomEquipment).map((equipment) => ({
            label: EQUIPMENT_LABELS[equipment],
            value: equipment,
          }))}
        />
      </Form.Item>

      <div className="grid gap-3 md:grid-cols-2">
        <Form.Item label="开放时间" name="open_time" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
          <Input placeholder="08:30" />
        </Form.Item>
        <Form.Item label="关闭时间" name="close_time" rules={[{ required: true, message: FORM_MESSAGES.required }]}>
          <Input placeholder="20:00" />
        </Form.Item>
      </div>

      <Space>
        <Button type="primary" htmlType="submit" loading={submitting}>
          保存会议室
        </Button>
        {onCancel && <Button onClick={onCancel}>取消</Button>}
      </Space>
    </Form>
  );
}
