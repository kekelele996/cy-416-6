import { Alert, Button } from 'antd';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { roomflowMessage } from '@/utils/message';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

interface GlobalErrorBoundaryState {
  error?: Error;
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RoomFlow render error', error, errorInfo);
    roomflowMessage.error(error.message);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--rf-bg)] p-6">
          <Alert
            type="error"
            showIcon
            message="应用渲染失败"
            description={this.state.error.message}
            action={<Button onClick={() => window.location.reload()}>刷新</Button>}
          />
        </main>
      );
    }

    return this.props.children;
  }
}
