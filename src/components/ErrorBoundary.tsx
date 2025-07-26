import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ hasError: true, error });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-red-50">
          <h1 className="text-3xl font-bold mb-2 text-red-600">Something went wrong.</h1>
          <p className="mb-4 text-gray-700">An unexpected error occurred in this application.</p>
          <pre className="bg-red-100 border border-red-400 p-3 rounded text-sm text-red-800 max-w-xl whitespace-pre-wrap">{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
