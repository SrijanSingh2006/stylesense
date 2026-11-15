import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { errorMessage } from '../../services/errors'
export function ApiStatus() {
  const [error, setError] = useState<any>(null)
  const location = useLocation()
  useEffect(() => { setError(null) }, [location.pathname, location.search])
  useEffect(() => {
    const listener = (event: Event) => setError((event as CustomEvent).detail)
    window.addEventListener('stylesense-api-error', listener)
    return () => window.removeEventListener('stylesense-api-error', listener)
  }, [])
  if (!error) return null
  const mutation = !['get', 'head'].includes(error.config?.method || 'get')
  return <div role="alert" className="sticky top-0 z-[100] bg-red-50 border-b border-red-200 text-red-800 p-4 text-sm">
    <span>{errorMessage(error)}</span>
    {mutation ? <span className="ml-2">Your input has been kept. Correct the issue or retry the action.</span> :
      <button className="ml-3 underline font-semibold" onClick={() => window.location.reload()}>Retry loading</button>}
    <button aria-label="Dismiss error" className="ml-4 underline" onClick={() => setError(null)}>Dismiss</button>
  </div>
}
export class RouteErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div role="alert" className="p-8">This page could not be displayed. <button onClick={() => window.location.reload()}>Retry</button></div> : this.props.children }
}
