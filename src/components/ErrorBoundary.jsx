import { Component } from 'react'

// Without one of these, a single error thrown while rendering any
// component unmounts the ENTIRE app, leaving a blank page. This catches
// it, shows a message with a way out, and keeps the nav bar usable.
// App.jsx gives it a `key` tied to the current route, so navigating to
// another page clears the error automatically.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Visible in the browser console and Vercel's logs for debugging. This
    // is also where an error-reporting service (e.g. Sentry's free tier)
    // would be hooked in later.
    console.error('This page crashed:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <h1 className="text-lg font-semibold mb-2">Something went wrong on this page</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
          Your order is not affected. Try reloading, or head back home.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.location.reload()} className="btn-primary text-sm px-5 py-2.5">
            Reload
          </button>
          <a href="/" className="btn-outline text-sm px-5 py-2.5">
            Home
          </a>
        </div>
      </div>
    )
  }
}
