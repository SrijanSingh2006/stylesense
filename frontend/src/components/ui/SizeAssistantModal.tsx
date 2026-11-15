import React, { useState } from 'react'
import { X, Ruler, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { calculateSize } from '../../services/api'
import type { SizeResponse } from '../../types'

interface SizeAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  productCategory: string
  brand: string
  onApplySize?: (size: string) => void
}

export const SizeAssistantModal: React.FC<SizeAssistantModalProps> = ({
  isOpen,
  onClose,
  productCategory,
  brand,
  onApplySize,
}) => {
  const [height, setHeight] = useState(175)
  const [chest, setChest] = useState(98)
  const [waist, setWaist] = useState(82)
  const [hips, setHips] = useState(96)
  const [preferredFit, setPreferredFit] = useState('Regular')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SizeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await calculateSize({
        category: productCategory,
        brand: brand,
        height_cm: height,
        chest_cm: chest,
        waist_cm: waist,
        hips_cm: hips,
        preferred_fit: preferredFit,
      })
      setResult(res)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to calculate size recommendation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-cream-300 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between bg-cream-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-muted flex items-center justify-center text-brand">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-charcoal-900 font-editorial">
                StyleSense Fit & Size Assistant
              </h2>
              <p className="text-xs text-charcoal-500">
                Calibrated for {brand} · {productCategory}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {!result ? (
            <>
              <p className="text-xs text-charcoal-600">
                Input your measurements to generate a brand-calibrated fit recommendation with tolerance adjustments.
              </p>

              {/* Fit Preference Tabs */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-2">
                  Silhouette Preference
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Slim', 'Regular', 'Relaxed', 'Oversized'].map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => setPreferredFit(fit)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        preferredFit === fit
                          ? 'border-brand bg-brand text-white shadow-sm'
                          : 'border-cream-300 bg-white text-charcoal-700 hover:border-cream-400'
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-medium text-charcoal-700 mb-1">
                    <span>Height</span>
                    <span className="font-semibold text-brand">{height} cm</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="210"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full accent-brand h-1.5 bg-cream-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-charcoal-700 mb-1">
                    <span>Chest Circumference</span>
                    <span className="font-semibold text-brand">{chest} cm</span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="140"
                    value={chest}
                    onChange={(e) => setChest(Number(e.target.value))}
                    className="w-full accent-brand h-1.5 bg-cream-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-charcoal-700 mb-1">
                    <span>Waist Circumference</span>
                    <span className="font-semibold text-brand">{waist} cm</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="130"
                    value={waist}
                    onChange={(e) => setWaist(Number(e.target.value))}
                    className="w-full accent-brand h-1.5 bg-cream-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-charcoal-700 mb-1">
                    <span>Hips Circumference</span>
                    <span className="font-semibold text-brand">{hips} cm</span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="140"
                    value={hips}
                    onChange={(e) => setHips(Number(e.target.value))}
                    className="w-full accent-brand h-1.5 bg-cream-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full py-3 px-4 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Evaluating anthropometric rules...' : 'Calculate Tailored Recommendation'}
              </button>
            </>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Result card */}
              <div className="p-5 bg-cream-50 rounded-xl border border-cream-300 text-center">
                <span className="text-xs uppercase tracking-widest text-charcoal-500 font-semibold">
                  Recommended Size
                </span>
                <div className="text-5xl font-extrabold text-brand my-2 font-editorial">
                  {result.recommended_size}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {Math.round(result.confidence_score * 100)}% Fit Match ({result.fit_category})
                </div>
                <p className="mt-3 text-xs text-charcoal-600 leading-relaxed max-w-md mx-auto">
                  {result.explanation}
                </p>
              </div>

              {/* Alternatives & matched charts */}
              {result.alternative_sizes?.length > 0 && (
                <div className="text-xs text-charcoal-600">
                  <span className="font-semibold text-charcoal-800">Alternative Options: </span>
                  {result.alternative_sizes.join(', ')}
                </div>
              )}

              <div className="p-3.5 bg-cream-100/80 rounded-lg text-[11px] text-charcoal-500 leading-relaxed border border-cream-200">
                <span className="font-semibold text-charcoal-700">Transparency Note: </span>
                {result.disclaimer}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="flex-1 py-2.5 px-4 border border-cream-300 text-charcoal-700 hover:bg-cream-100 text-xs font-semibold rounded-xl"
                >
                  Adjust Measurements
                </button>
                {onApplySize && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplySize(result.recommended_size)
                      onClose()
                    }}
                    className="flex-1 py-2.5 px-4 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl shadow"
                  >
                    Select Size {result.recommended_size}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
