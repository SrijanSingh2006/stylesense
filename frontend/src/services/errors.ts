import axios from 'axios'
export function errorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : 'Request failed. Please try again.'
  const detail = error.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => `${d.loc?.slice(1).join('.') || 'Input'}: ${d.msg}`).join('; ')
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please retry.'
  if (!error.response) return 'Cannot reach the server. Check your connection and retry.'
  return `Request failed (${error.response.status}). Please try again.`
}
