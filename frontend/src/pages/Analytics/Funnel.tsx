import { RequestError } from '../../components/ui/RequestError'
import React, { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { TrendingDown, Users, AlertTriangle, Info, ArrowDown } from 'lucide-react'
import { fetchFunnel, fetchCohorts } from '../../services/api'
import type { FunnelResponse, CohortResponse } from '../../types'

export const FunnelPage: React.FC = () => {
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null)
  const [cohorts, setCohorts] = useState<CohortResponse | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [f, c] = await Promise.all([fetchFunnel(days), fetchCohorts()])
        setFunnel(f)
        setCohorts(c)
      } catch (err) {
        console.error('Failed to load funnel analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [days])

  if (!loading && (!funnel || !cohorts)) return <RequestError />
  if (loading || !funnel || !cohorts) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
        <p className="mt-3 text-xs text-charcoal-500 font-medium">Computing session progression funnel...</p>
      </div>
    )
  }

  const chartData = funnel.steps.map((s) => ({
    name: s.step_name,
    sessions: s.count,
    dropOffRate: s.drop_off_rate,
    conversion: s.conversion_from_prev,
  }))

  const colors = ['#144233', '#1b5a45', '#247257', '#338f6f', '#46aa86', '#5fc49f']

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Conversion Funnel & Cohort Retention
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Session-level progression through the 6 core discovery and checkout lifecycle milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Timeframe:
          </span>
          <div className="flex bg-white rounded-xl border border-cream-300 p-1 shadow-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`py-1 px-3 text-xs font-semibold rounded-lg transition-colors ${
                  days === d
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Biggest Drop-off Alert Callout */}
      <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-4">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-900">
            Friction Alert: Biggest Funnel Drop-off at "{funnel.biggest_dropoff_stage}"
          </h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            Shoppers exit before completing their cart transition. Recommendation: Deploy the Fit & Size Assistant prominently on product pages and simplify outfit bundle additions to reduce cart hesitation.
          </p>
          <span className="text-[11px] text-amber-700 font-mono block pt-1">
            Methodology: {funnel.methodology}
          </span>
        </div>
      </div>

      {/* 6-Stage Funnel Chart */}
      <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-6">
        <h3 className="text-base font-serif font-bold text-charcoal-900">
          6-Stage Consumer Milestone Progression
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#646973' }} />
              <YAxis tick={{ fontSize: 11, fill: '#646973' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-charcoal-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <span className="font-bold block">{data.name}</span>
                        <div>Sessions: <strong className="text-emerald-400">{data.sessions}</strong></div>
                        <div>Step Conv: <strong>{data.conversion}%</strong></div>
                        <div>Drop-off: <strong className="text-amber-400">{data.dropOffRate}%</strong></div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar dataKey="sessions" radius={[6, 6, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Funnel Step Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-cream-200">
          {funnel.steps.map((step, idx) => (
            <div key={step.stage_key} className="p-3 bg-cream-50 rounded-xl border border-cream-200 space-y-1">
              <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block truncate">
                {idx + 1}. {step.step_name}
              </span>
              <div className="text-lg font-bold text-charcoal-900 font-mono">
                {step.count.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold">
                {step.conversion_from_prev}% conv
              </div>
              {idx > 0 && (
                <div className="text-[11px] text-amber-700">
                  -{step.drop_off_count} ({step.drop_off_rate}%)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4-Week Cohort Retention Heatmap */}
      <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200 pb-4">
          <div>
            <h3 className="text-base font-serif font-bold text-charcoal-900">
              4-Week Customer Cohort Retention Matrix
            </h3>
            <p className="text-xs text-charcoal-500">
              Percentage of acquired customers who remain active across rolling 4-week observation windows.
            </p>
          </div>
          <span className="text-xs font-semibold text-charcoal-500">
            {cohorts.period}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead className="bg-cream-50 text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold border-b border-cream-200">
              <tr>
                <th className="py-3 px-4 text-left">Cohort Acquisition</th>
                <th className="py-3 px-3">Size</th>
                <th className="py-3 px-3">Week 0</th>
                <th className="py-3 px-3">Week 1</th>
                <th className="py-3 px-3">Week 2</th>
                <th className="py-3 px-3">Week 3</th>
                <th className="py-3 px-3">Week 4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 font-mono">
              {cohorts.cohorts.map((row) => (
                <tr key={row.cohort_week} className="hover:bg-cream-50/50">
                  <td className="py-3 px-4 text-left font-sans font-semibold text-charcoal-800">
                    {row.cohort_week}
                  </td>
                  <td className="py-3 px-3 text-charcoal-600 font-medium">{row.cohort_size} cust</td>
                  {row.weeks.map((w) => {
                    // Color intensity based on retention percentage
                    const r = w.retention_rate ?? -1
                    let bg = 'bg-cream-100 text-charcoal-700'
                    if (r >= 90) bg = 'bg-emerald-700 text-white font-bold'
                    else if (r >= 40) bg = 'bg-emerald-200 text-emerald-950 font-semibold'
                    else if (r >= 25) bg = 'bg-emerald-100 text-emerald-900'
                    else if (r >= 15) bg = 'bg-emerald-50 text-emerald-800'

                    return (
                      <td key={w.week_index} className="py-3 px-2">
                        <span className={`inline-block w-16 py-1.5 rounded-lg text-xs ${bg}`}>
                          {r < 0 ? 'Pending' : `${r}%`}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
