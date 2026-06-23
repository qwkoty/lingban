'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: undefined });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-dvh flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle size={32} className="text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">出错了</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {this.state.error?.message || '应用遇到了意外错误'}
            </p>
            <button
              onClick={this.handleRefresh}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={18} />
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
