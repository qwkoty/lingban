import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold mb-4">页面出错了</h2>
          <pre className="text-left text-sm text-white/70 bg-black/30 rounded-xl p-4 max-w-full overflow-auto whitespace-pre-wrap">
            {this.state.error.stack || this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 rounded-full bg-white/15 hover:bg-white/20 transition-colors"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
