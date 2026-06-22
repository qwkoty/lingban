import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full glass flex items-center justify-center text-white/70 mb-4 text-2xl">
            😵
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">出错了</h2>
          <p className="text-white/50 text-sm mb-6">页面遇到了一点小问题</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
