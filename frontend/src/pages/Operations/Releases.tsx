import { useAuthStore, can } from '../../auth/state'
import { errorMessage } from '../../services/errors'
import React, { useEffect, useState } from 'react'
import { Rocket, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Check } from 'lucide-react'
import { fetchReleases, updateRelease } from '../../services/api'
import type { Release } from '../../types'

export const ReleasesPage: React.FC = () => {
  const editable = can(useAuthStore((s) => s.user), 'releases.manage')
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchReleases()
      setReleases(data)
    } catch (err) {
      console.error('Failed to load releases:')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleToggleChecklistItem = async (rel: Release, key: string) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    const currentVal = rel.checklist?.[key] || false
    const updatedChecklist = { ...rel.checklist, [key]: !currentVal }

    try {
      await updateRelease(rel.id, { checklist: updatedChecklist })
      load()
    } catch (err: any) {
      setErrorMsg(errorMessage(err))
    }
  }

  const handleApproveDeploy = async (rel: Release) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await updateRelease(rel.id, { status: 'READY_FOR_DEPLOY' })
      setSuccessMsg(`Release ${rel.version} approved for deployment!`)
      load()
    } catch (err: any) {
      setErrorMsg(errorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
        <p className="mt-3 text-xs text-charcoal-500 font-medium">Checking release verification status...</p>
      </div>
    )
  }

  const CHECKLIST_LABELS: Record<string, string> = {
    engineering_completed: 'Engineering code complete & merged',
    design_approved: 'Design & UI/UX signoff',
    qa_testing_passed: 'QA test evidence reviewed and approved',
    analytics_instrumented: 'Analytics event tracking & funnel verified',
    documentation_ready: 'PRD, SQL documentation & Runbook published',
    stakeholder_signoff: 'Commercial & merchandising leadership signoff',
    release_notes_published: 'Customer-facing release notes finalized',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
          Release Readiness & Launch Verification
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Quality gate validation preventing unverified commercial deployments until all mandatory testing items pass.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Release Cards */}
      <div className="space-y-6">
        {releases.map((rel) => (
          <div
            key={rel.id}
            className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-6"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-brand" />
                  <h3 className="text-xl font-serif font-bold text-charcoal-900">
                    {rel.name}
                  </h3>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-cream-200 text-charcoal-800 font-bold">
                    {rel.version}
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mt-1">{rel.release_notes}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block">
                    Readiness Score
                  </span>
                  <span className="text-2xl font-bold font-editorial text-brand">
                    {rel.readiness_percentage}%
                  </span>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    rel.status === 'READY_FOR_DEPLOY'
                      ? 'bg-emerald-100 text-emerald-800'
                      : rel.status === 'DEPLOYED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {rel.status}
                </span>
              </div>
            </div>

            {/* Checklist Matrix */}
            <div>
              <span className="text-xs font-bold text-charcoal-700 uppercase tracking-wider block mb-3">
                Mandatory Launch Verification Checklist
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(rel.checklist || {}).map(([key, val]) => (
                  <button
                    key={key}
                    disabled={!editable}
                    aria-label={`Checklist ${key}`}
                    aria-pressed={val}
                    type="button"
                    onClick={() => handleToggleChecklistItem(rel, key)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      val
                        ? 'border-emerald-300 bg-emerald-50/60 text-emerald-950'
                        : 'border-cream-300 bg-cream-50 text-charcoal-700 hover:border-cream-400'
                    }`}
                  >
                    <span className="font-medium">{CHECKLIST_LABELS[key] || key}</span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        val ? 'bg-emerald-600 text-white' : 'border border-cream-400 bg-white'
                      }`}
                    >
                      {val && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-cream-200 flex items-center justify-between">
              <span className="text-[11px] text-charcoal-500">
                Gate Rule: Engineering, QA, analytics, documentation and stakeholder sign-off are required.
              </span>

              {editable && rel.status !== 'READY_FOR_DEPLOY' && rel.status !== 'DEPLOYED' && (
                <button
                  onClick={() => handleApproveDeploy(rel)}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl shadow transition-colors"
                >
                  Approve Ready for Production Deploy
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
