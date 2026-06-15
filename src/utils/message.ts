import { App } from 'antd';

let messageApi: ReturnType<typeof App.useApp>['message'] | null = null;

export function bindMessageApi(api: ReturnType<typeof App.useApp>['message']): void {
  messageApi = api;
}

export const roomflowMessage = {
  success(content: string) {
    messageApi?.success(content);
  },
  info(content: string) {
    messageApi?.info(content);
  },
  warning(content: string) {
    messageApi?.warning(content);
  },
  error(content: string) {
    messageApi?.error(content);
  },
};
