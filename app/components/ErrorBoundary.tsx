'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error info:', errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // You can also log to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReload = () => {
    // Reset error state and reload
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  handleRetry = () => {
    // Just reset error state to try rendering again
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              哎呀，出错了
            </h2>
            <p className="text-gray-600 mb-6">
              应用程序遇到了一个意外错误。请尝试重新加载页面。
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-sm font-mono text-red-600 break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="mt-2 text-xs text-gray-500 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                重试
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md"
              >
                重新加载
              </button>
            </div>

            {/* Help Text */}
            <p className="mt-6 text-xs text-gray-400">
              如果问题持续存在，请联系技术支持
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
