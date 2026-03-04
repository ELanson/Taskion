import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 text-white font-sans">
                    <div className="max-w-md w-full bg-[#121214] border border-gray-800 rounded-3xl p-8 shadow-2xl text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={32} className="text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Systems Critical</h1>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            A severe logic failure occurred. The interface has been locked to prevent data corruption.
                        </p>

                        <div className="bg-black/40 rounded-xl p-4 mb-8 text-left border border-gray-800/50">
                            <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest mb-1">Diagnostic Info</p>
                            <p className="text-xs font-mono text-red-400 break-all leading-tight">
                                {this.state.error?.message || 'Unknown Execution Error'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all"
                            >
                                <RefreshCw size={16} />
                                Restart Interface
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold text-sm transition-all"
                            >
                                <Home size={16} />
                                Back to Terminal
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
