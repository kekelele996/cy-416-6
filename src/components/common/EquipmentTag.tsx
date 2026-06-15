import { Tag } from 'antd';
import { EQUIPMENT_COLORS, type RoomEquipment } from '@/constants/room';
import { formatEquipment } from '@/utils/formatters';

interface EquipmentTagProps {
  equipment: RoomEquipment;
}

export function EquipmentTag({ equipment }: EquipmentTagProps) {
  return (
    <Tag color={EQUIPMENT_COLORS[equipment]} className="m-0">
      {formatEquipment(equipment)}
    </Tag>
  );
}
