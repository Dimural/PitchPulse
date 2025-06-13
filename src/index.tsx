import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

console.log('Starting application...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

console.log('Root element found, rendering app...')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

console.log('App rendered') 