import { errorMessage } from '../../services/errors'
import React, { useEffect, useState } from 'react'
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react'
import {
  fetchExperiments,
  assignExperiment,
  trackEvent,
  createExperiment,
  updateExperiment,
  fetchExperimentResults,
} from '../../services/api'
import type { Experiment, ExperimentResults } from '../../types'

export const ExperimentListPage: React.FC = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [selectedExpResults, setSelectedExpResults] = useState<ExperimentResults | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(false)

  // New experiment form
  const [name, setName] = useState('')
  const [hypothesis, setHypothesis] = useState('')
  const [description, setDescription] = useState('')
  const [primaryMetric, setPrimaryMetric] = useState('conversion_rate')
  const [trafficPct, setTrafficPct] = useState(50)
  const [observationCustomer, setObservationCustomer] = useState(1)
  const [observationNotice, setObservationNotice] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchExperiments()
      setExperiments(data)
      if (data.length > 0) {
        loadResults(data[0].id)
      }
    } catch (err) {
      console.error('Failed to load experiments:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadResults = async (expId: number) => {
    setResultsLoading(true)
    try {
      const res = await fetchExperimentResults(expId)
      setSelectedExpResults(res)
    } catch (err) {
      console.error('Failed to load experiment results:', err)
    } finally {
      setResultsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createExperiment({
        name,
        hypothesis,
        description,
        primary_metric: primaryMetric,
        traffic_percentage: trafficPct,
      })
      setModalOpen(false)
      setName('')
      setHypothesis('')
      setDescription('')
      loadData()
    } catch (err: any) {
      alert(errorMessage(err))
    }
  }

  const handleToggleStatus = async (exp: Experiment) => {
    const nextStatus = exp.status === 'RUNNING' ? 'PAUSED' : 'RUNNING'
    try {
      await updateExperiment(exp.id, { status: nextStatus })
      loadData()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  return (
    <div className="space-y-8">
      {selectedExpResults && <section className="p-4 bg-white rounded-xl border border-cream-300 space-y-2">
        <h2 className="font-semibold">Record an actual demo exposure</h2>
        <p className="text-xs">Assign a seeded customer and record that the experiment was displayed. Purchases after exposure are attributed for seven days within the experiment window.</p>
        <label>Customer ID <input aria-label="Observation customer ID" type="number" min="1" max="30" value={observationCustomer} onChange={(e) => setObservationCustomer(Number(e.target.value))} className="border rounded p-2 w-20" /></label>
        <button className="ml-3 bg-brand text-white rounded p-2" onClick={async () => {
          try {
            const assignment = await assignExperiment(selectedExpResults.experiment_id, observationCustomer)
            await trackEvent({ customer_id: observationCustomer, session_id: `operator-${Date.now()}`, experiment_id: assignment.experiment_id, variant: assignment.variant, event_type: 'experiment_exposure' })
            setObservationNotice(`Recorded ${assignment.variant} exposure for customer ${observationCustomer}`)
            loadResults(selectedExpResults.experiment_id)
          } catch { setObservationNotice('Exposure was not recorded. Check the error and experiment status.') }
        }}>Assign and record exposure</button>
        <p role="status" className="text-xs">{observationNotice}</p>
      </section>}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Experimentation & A/B Testing Engine
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Deterministic customer-hashed variant assignment with Two-Proportion Z-Test statistical rigor.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Experiment</span>
        </button>
      </div>

      {/* Main Grid: Experiments list on left, Results on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-xs font-bold text-charcoal-700 uppercase tracking-wider">
            All Experiments ({experiments.length})
          </h2>

          <div className="space-y-3">
            {experiments.map((exp) => {
              const active = selectedExpResults?.experiment_id === exp.id
              return (
                <div
                  key={exp.id}
                  onClick={() => loadResults(exp.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-white border-brand shadow-md ring-1 ring-brand'
                      : 'bg-white border-cream-300 hover:border-cream-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-charcoal-900 truncate">
                      {exp.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        exp.status === 'RUNNING'
                          ? 'bg-emerald-100 text-emerald-800'
                          : exp.status === 'CONCLUDED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-cream-200 text-charcoal-700'
                      }`}
                    >
                      {exp.status}
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-500 line-clamp-2 mt-2 leading-relaxed">
                    {exp.hypothesis}
                  </p>

                  <div className="mt-3 pt-3 border-t border-cream-200 flex items-center justify-between text-[11px] text-charcoal-500">
                    <span>Traffic: {exp.traffic_percentage}% Treatment</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleStatus(exp)
                      }}
                      className="text-brand hover:underline font-semibold flex items-center gap-1"
                    >
                      {exp.status === 'RUNNING' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{exp.status === 'RUNNING' ? 'Pause' : 'Start'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Statistical Results */}
        <div className="lg:col-span-7">
          {resultsLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-cream-300">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand border-r-transparent" />
              <p className="mt-2 text-xs text-charcoal-500">Computing hypothesis confidence intervals...</p>
            </div>
          ) : selectedExpResults ? (
            <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-cream-200 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand-muted px-2 py-0.5 rounded">
                    Primary Metric: {selectedExpResults.primary_metric}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-charcoal-900 mt-2">
                    {selectedExpResults.name}
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    Evaluated via {selectedExpResults.statistical_test}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      selectedExpResults.is_statistically_significant
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedExpResults.is_statistically_significant ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {selectedExpResults.is_statistically_significant
                      ? 'Statistically Significant (p < 0.05)'
                      : 'Not Yet Significant'}
                  </span>
                </div>
              </div>

              {/* Control vs Treatment Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Control Box */}
                <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-charcoal-600 uppercase tracking-wider">
                      Control Group (A)
                    </span>
                    <span className="text-[11px] text-charcoal-400">Baseline</span>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-charcoal-900 font-mono">
                      {selectedExpResults.control.conversion_rate}%
                    </span>
                    <span className="text-xs text-charcoal-500 block">Conversion Rate</span>
                  </div>
                  <div className="pt-2 border-t border-cream-200 text-xs text-charcoal-600 space-y-1">
                    <div>Sample: <strong>{selectedExpResults.control.sample_size}</strong> shoppers</div>
                    <div>Conversions: <strong>{selectedExpResults.control.conversions}</strong></div>
                    <div>AOV: <strong>₹{selectedExpResults.control.average_order_value}</strong></div>
                  </div>
                </div>

                {/* Treatment Box */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Treatment Group (B)
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">
                      {selectedExpResults.relative_lift_available === false ? 'Unavailable (zero control rate)' : `${selectedExpResults.relative_lift_pct >= 0 ? '+' : ''}${selectedExpResults.relative_lift_pct}% Lift`}
                    </span>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-emerald-900 font-mono">
                      {selectedExpResults.treatment.conversion_rate}%
                    </span>
                    <span className="text-xs text-emerald-700 block">Conversion Rate</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-100 text-xs text-emerald-900 space-y-1">
                    <div>Sample: <strong>{selectedExpResults.treatment.sample_size}</strong> shoppers</div>
                    <div>Conversions: <strong>{selectedExpResults.treatment.conversions}</strong></div>
                    <div>AOV: <strong>₹{selectedExpResults.treatment.average_order_value}</strong></div>
                  </div>
                </div>
              </div>

              {/* Statistical Test Metrics */}
              <div className="p-4 bg-cream-100 rounded-xl space-y-3 text-xs">
                <span className="font-bold text-charcoal-800 uppercase tracking-wider text-[11px] block">
                  Statistical Power & Significance Diagnostics
                </span>
                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div>
                    <span className="text-charcoal-500 block text-[10px]">P-VALUE</span>
                    <span className="text-sm font-bold text-charcoal-900">{selectedExpResults.p_value}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[10px]">Z-SCORE</span>
                    <span className="text-sm font-bold text-charcoal-900">{selectedExpResults.z_score}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[10px]">95% CONF. INTERVAL</span>
                    <span className="text-sm font-bold text-charcoal-900">
                      [{selectedExpResults.confidence_interval_95[0]}, {selectedExpResults.confidence_interval_95[1]}]
                    </span>
                  </div>
                </div>
              </div>

              {/* Decision Recommendation */}
              <div className="p-4 bg-brand-muted/80 rounded-xl border border-brand/20 space-y-1">
                <span className="text-[11px] font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Product Manager Decision Guidance
                </span>
                <p className="text-xs text-charcoal-800 leading-relaxed font-medium">
                  {selectedExpResults.decision_recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-cream-300 text-charcoal-500 text-xs">
              Select an experiment to view hypothesis analytics.
            </div>
          )}
        </div>
      </div>

      {/* Create Experiment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-cream-300 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <h3 className="text-sm font-bold text-charcoal-900 font-editorial">
                Create New Storefront A/B Experiment
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label htmlFor="experimentlist-field-1" className="block font-semibold text-charcoal-700 mb-1">Experiment Name</label>
                <input id="experimentlist-field-1"
                  type="text"
                  required
                  placeholder="e.g. Complete-the-Look Outfit Bundling"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                />
              </div>

              <div>
                <label htmlFor="experimentlist-field-2" className="block font-semibold text-charcoal-700 mb-1">Hypothesis</label>
                <textarea id="experimentlist-field-2"
                  required
                  rows={2}
                  placeholder="e.g. Displaying outfit bundles on PDP will increase multi-item order rate by 18%."
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="experimentlist-field-3" className="block font-semibold text-charcoal-700 mb-1">Primary Metric</label>
                  <select id="experimentlist-field-3"
                    value={primaryMetric}
                    onChange={(e) => setPrimaryMetric(e.target.value)}
                    className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                  >
                    <option value="conversion_rate">Conversion Rate</option>
                    <option value="ctr">Click-Through Rate (CTR)</option>
                    <option value="aov">Average Order Value</option>
                    <option value="return_rate">Return Rate Reduction</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="experimentlist-field-4" className="block font-semibold text-charcoal-700 mb-1">Treatment Traffic %</label>
                  <input id="experimentlist-field-4"
                    type="number"
                    min="10"
                    max="90"
                    value={trafficPct}
                    onChange={(e) => setTrafficPct(Number(e.target.value))}
                    className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-cream-300 text-charcoal-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand text-white font-semibold rounded-xl shadow"
                >
                  Create Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
