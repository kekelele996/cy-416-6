import { InboxOutlined } from '@ant-design/icons';
import { Button, Empty, Typography } from 'antd';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Empty
        image={<InboxOutlined className="text-4xl text-[var(--rf-muted)]" />}
        description={
          <div>
            <Typography.Text strong>{title}</Typography.Text>
            {description && <p className="m-0 mt-1 text-sm text-[var(--rf-muted)]">{description}</p>}
          </div>
        }
      >
        {action ?? <Button href="/booking">创建预约</Button>}
      </Empty>
    </div>
  );
}
