import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="text-5xl mb-4">😵</div>
          <h2 className="text-lg font-medium text-white/70">页面出错了</h2>
          <p className="mt-2 text-sm text-white/40 max-w-xs">
            {this.state.error?.message || '发生了未知错误'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 rounded-xl glass hover:bg-white/10 transition-colors touch-target"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
