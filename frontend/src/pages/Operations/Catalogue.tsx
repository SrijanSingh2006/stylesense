import React, { useEffect, useState } from 'react'
import { CheckSquare, AlertCircle, Check, Sparkles, RefreshCw } from 'lucide-react'
import { fetchCatalogueQuality, resolveCatalogueIssue } from '../../services/api'
import type { CatalogueQuality } from '../../types'

export const CataloguePage: React.FC = () => {
  const [data, setData] = useState<CatalogueQuality | null>(null)
  const [resolvingId, setResolvingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchCatalogueQuality()
      setData(res)
    } catch (err) {
      console.error('Failed to audit catalogue:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleResolve = async (issueId: number) => {
    setResolvingId(issueId)
    try {
      await resolveCatalogueIssue(issueId)
      load()
    } catch (err) {
      console.error('Failed to resolve issue:', err)
    } finally {
      setResolvingId(null)
    }
  }

  if (loading || !data) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
        <p className="mt-3 text-xs text-charcoal-500 font-medium">Auditing catalogue attribute integrity...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Automated Catalogue Quality & Integrity Audit
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Automated anomaly detection for missing descriptions, incomplete size charts, pricing inversions, and duplicates.
          </p>
        </div>

        <button
          onClick={load}
          className="px-4 py-2 border border-cream-300 bg-white hover:bg-cream-100 text-charcoal-700 text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand" />
          <span>Re-Run Quality Audit</span>
        </button>
      </div>

      {/* Health Score Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Catalogue Health Score
          </span>
          <div className="text-4xl font-bold text-brand font-editorial">
            {data.catalogue_health_score}/100
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">
            {data.catalogue_health_score >= 80 ? 'Grade A - Commercial Ready' : 'Requires Attention'}
          </span>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Total Audited SKUs
          </span>
          <div className="text-3xl font-bold text-charcoal-900 font-editorial">
            {data.total_products_checked}
          </div>
          <span className="text-[11px] text-charcoal-400">Products inspected</span>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Critical Blocking Issues
          </span>
          <div className="text-3xl font-bold text-rose-700 font-editorial">
            {data.critical_issues_count}
          </div>
          <span className="text-[11px] text-charcoal-400">Pricing or SKU errors</span>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Content Enrichment Warnings
          </span>
          <div className="text-3xl font-bold text-amber-700 font-editorial">
            {data.warning_issues_count}
          </div>
          <span className="text-[11px] text-charcoal-400">Descriptions or size charts</span>
        </div>
      </div>

      {/* Issues Table */}
      <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200 pb-3">
          <h3 className="text-base font-serif font-bold text-charcoal-900">
            Active Discovered Issues ({data.issues.length})
          </h3>
          <span className="text-xs text-charcoal-500">
            Click 'Resolve' to verify corrective action
          </span>
        </div>

        {data.issues.length === 0 ? (
          <div className="p-12 text-center text-xs text-emerald-700 font-semibold">
            ✦ All catalogue issues resolved! 100% data completeness.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-50 text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold border-b border-cream-200">
                <tr>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Issue Type</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Suggested Remediation</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {data.issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-cream-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-charcoal-900 max-w-[180px] truncate">
                      {issue.product_name}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-charcoal-600">
                      {issue.issue_type}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          issue.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : issue.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-cream-200 text-charcoal-700'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-charcoal-700 max-w-[240px] truncate">
                      {issue.description}
                    </td>
                    <td className="py-3 px-3 text-charcoal-500 max-w-[200px] truncate">
                      {issue.suggested_action}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleResolve(issue.id)}
                        disabled={resolvingId === issue.id}
                        className="px-3 py-1 bg-brand hover:bg-brand-dark text-white text-[11px] font-semibold rounded-lg shadow-sm disabled:opacity-50"
                      >
                        {resolvingId === issue.id ? 'Resolving...' : 'Resolve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
