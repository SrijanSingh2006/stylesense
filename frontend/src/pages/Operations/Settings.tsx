import React, { useEffect, useState } from 'react'
import { Settings, Sliders, ToggleLeft, ToggleRight, RotateCcw, Check, Sparkles } from 'lucide-react'
import { fetchFeatureFlags, updateFeatureFlag } from '../../services/api'
import type { FeatureFlag } from '../../types'

export const SettingsPage: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchFeatureFlags()
      setFlags(data)
    } catch (err) {
      console.error('Failed to load feature flags:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      await updateFeatureFlag(flag.id, { enabled: !flag.enabled })
      setSavedNotice(`Feature '${flag.name}' ${!flag.enabled ? 'Enabled' : 'Disabled'}`)
      setTimeout(() => setSavedNotice(null), 2500)
      load()
    } catch (err) {
      console.error('Failed to update flag:', err)
    }
  }

  const handleRolloutChange = async (flag: FeatureFlag, newPct: number) => {
    try {
      await updateFeatureFlag(flag.id, { rollout_percentage: newPct })
      setSavedNotice(`Rollout for '${flag.name}' updated to ${newPct}%`)
      setTimeout(() => setSavedNotice(null), 2500)
      load()
    } catch (err) {
      console.error('Failed to update rollout percentage:', err)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
        <p className="mt-3 text-xs text-charcoal-500 font-medium">Loading feature flag configurations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
          Feature Flags & Platform Settings
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Dynamic runtime toggles and deterministic rollout allocation across the storefront customer journey.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Flags List */}
      <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-6">
        <h2 className="text-sm font-bold text-charcoal-900 border-b border-cream-200 pb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-brand" />
          <span>Active Commercial Feature Flags</span>
        </h2>

        <div className="space-y-5">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-charcoal-900">
                    {flag.name}
                  </span>
                  <p className="text-xs text-charcoal-500 mt-0.5">{flag.description}</p>
                </div>

                <button
                  onClick={() => handleToggle(flag)}
                  className="p-1 text-charcoal-700 hover:text-brand transition-colors"
                >
                  {flag.enabled ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600 fill-current" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-charcoal-400" />
                  )}
                </button>
              </div>

              {/* Rollout percentage slider */}
              {flag.enabled && (
                <div className="pt-2 border-t border-cream-200">
                  <div className="flex justify-between text-xs font-semibold text-charcoal-700 mb-1">
                    <span>Target Population Rollout</span>
                    <span className="font-mono font-bold text-brand">
                      {flag.rollout_percentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={flag.rollout_percentage}
                    onChange={(e) => handleRolloutChange(flag, Number(e.target.value))}
                    className="w-full accent-brand h-1.5 bg-cream-200 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Developer Reset Section */}
      <div className="p-6 bg-cream-50 rounded-2xl border border-cream-300 space-y-3">
        <h3 className="text-xs font-bold text-charcoal-800 uppercase tracking-wider">
          Demo Dataset Initialisation
        </h3>
        <p className="text-xs text-charcoal-500 leading-relaxed">
          Need to reset all synthetic orders, session funnels, and inventory back to seed state? Run the deterministic seed script from your terminal:
        </p>
        <code className="block p-3 bg-charcoal-900 text-cream-200 rounded-xl text-xs font-mono">
          python -m app.seed
        </code>
      </div>
    </div>
  )
}
