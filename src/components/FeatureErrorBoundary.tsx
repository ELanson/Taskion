import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  featureName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Feature Error [${this.props.featureName || 'Unknown'}]:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex flex-col items-center justify-center text-center space-y-3 min-h-[100px]">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest leading-none mb-1">
              {this.props.featureName || 'Feature'} Unavailable
            </p>
            <p className="text-[10px] text-gray-500 font-medium line-clamp-1">
              {this.state.error?.message || 'Unexpected logic failure'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-[10px] font-bold text-gray-300 rounded-lg transition-all"
          >
            <RefreshCw size={10} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
