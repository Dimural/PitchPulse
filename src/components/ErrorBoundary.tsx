import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-100 p-4">
          <div className="alert alert-error">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold">Something went wrong</h2>
              <pre className="text-sm whitespace-pre-wrap">
                {this.state.error?.toString()}
              </pre>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 