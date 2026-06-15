import { App } from 'antd';
import { useEffect } from 'react';
import { bindMessageApi } from '@/utils/message';

export function MessageBinder() {
  const { message } = App.useApp();

  useEffect(() => {
    bindMessageApi(message);
  }, [message]);

  return null;
}
