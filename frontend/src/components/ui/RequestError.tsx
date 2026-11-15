export function RequestError() {
  return <div role="alert" className="p-8 text-center text-red-800">This page could not load its data. <button className="underline" onClick={() => window.location.reload()}>Retry</button></div>
}
