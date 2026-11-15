import { RequestError } from '../../components/ui/RequestError'
import React, { useEffect, useState } from 'react'
import { Users, Crown, Heart, Sparkles, UserPlus, AlertOctagon, Moon, Search } from 'lucide-react'
import { fetchSegments } from '../../services/api'
import type { SegmentationResponse } from '../../types'

export const SegmentationPage: React.FC = () => {
  const [data, setData] = useState<SegmentationResponse | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetchSegments()
        setData(res)
      } catch (err) {
        console.error('Failed to load segments:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (!loading && (!data)) return <RequestError />
  if (loading || !data) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
        <p className="mt-3 text-xs text-charcoal-500 font-medium">Computing RFM matrices and behavioral clusters...</p>
      </div>
    )
  }

  const segmentIcons: Record<string, any> = {
    Champions: Crown,
    'Loyal Customers': Heart,
    'Potential Loyalists': Sparkles,
    'New Customers': UserPlus,
    'At-Risk Customers': AlertOctagon,
    'Dormant Customers': Moon,
  }

  const filteredCustomers = data.customers.filter((c) => {
    const matchesSegment = selectedSegment === 'ALL' || c.segment === selectedSegment
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSegment && matchesSearch
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
          Customer Segmentation (RFM Analysis)
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Behavioral categorization based on Recency of visit, Frequency of purchases, and Total Monetary spend.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.summary.map((seg) => {
          const Icon = segmentIcons[seg.segment_name] || Users
          const active = selectedSegment === seg.segment_name
          return (
            <div
              key={seg.segment_name}
              onClick={() => setSelectedSegment(active ? 'ALL' : seg.segment_name)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                active
                  ? 'bg-brand text-white border-brand shadow-lg'
                  : 'bg-white border-cream-300 hover:border-cream-400 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${active ? 'bg-white/10 text-white' : 'bg-cream-100 text-brand'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-bold ${active ? 'text-white' : 'text-charcoal-900'}`}>
                    {seg.segment_name}
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold ${active ? 'text-brand-accent' : 'text-charcoal-500'}`}>
                  {seg.percentage}%
                </span>
              </div>

              <div>
                <span className={`text-2xl font-bold font-editorial ${active ? 'text-white' : 'text-charcoal-900'}`}>
                  {seg.customer_count} shoppers
                </span>
                <span className={`text-xs block mt-0.5 ${active ? 'text-cream-200' : 'text-charcoal-500'}`}>
                  Avg Spend: ₹{seg.average_spend.toLocaleString('en-IN')}
                </span>
              </div>

              <p className={`text-[11px] leading-relaxed pt-2 border-t ${
                active ? 'border-white/20 text-cream-200' : 'border-cream-200 text-charcoal-600'
              }`}>
                {seg.strategy}
              </p>
            </div>
          )
        })}
      </div>

      {/* Customers Table */}
      <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-4">
          <div>
            <h3 className="text-base font-serif font-bold text-charcoal-900">
              Customer RFM Cohort List ({filteredCustomers.length})
            </h3>
            <p className="text-xs text-charcoal-500">
              {selectedSegment === 'ALL' ? 'Displaying all customer segments' : `Filtered by: ${selectedSegment}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-cream-50 border border-cream-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {selectedSegment !== 'ALL' && (
              <button
                onClick={() => setSelectedSegment('ALL')}
                className="text-xs text-brand hover:underline font-semibold"
              >
                Clear Segment
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-50 text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold border-b border-cream-200">
              <tr>
                <th className="py-3 px-3">Customer ID</th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Segment</th>
                <th className="py-3 px-3 text-right">Recency</th>
                <th className="py-3 px-3 text-right">Frequency</th>
                <th className="py-3 px-3 text-right">Monetary Spend</th>
                <th className="py-3 px-3">Recommended Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {filteredCustomers.map((c) => (
                <tr key={c.customer_id} className="hover:bg-cream-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono text-charcoal-500">#{c.customer_id}</td>
                  <td className="py-3 px-3 font-semibold text-charcoal-900">{c.name}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cream-200 text-charcoal-800">
                      {c.segment}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-charcoal-600">
                    {c.recency_days} days ago
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-charcoal-900">
                    {c.frequency_orders} orders
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-brand">
                    ₹{c.monetary_spend.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-charcoal-600 text-[11px] max-w-xs truncate">
                    {c.actionable_strategy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
