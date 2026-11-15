import { RequestError } from '../../components/ui/RequestError'
import React, { useEffect, useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  RotateCcw,
  Percent,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Package,
} from 'lucide-react'
import { fetchOverviewMetrics, fetchNorthStar, fetchProductPerformance } from '../../services/api'
import type { OverviewMetrics, NorthStarResponse, ProductPerformanceItem } from '../../types'

export const OverviewPage: React.FC = () => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null)
  const [northStar, setNorthStar] = useState<NorthStarResponse | null>(null)
  const [products, setProducts] = useState<ProductPerformanceItem[]>([])
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [m, ns, p] = await Promise.all([
          fetchOverviewMetrics(days),
          fetchNorthStar(),
          fetchProductPerformance(15, days),
        ])
        setMetrics(m)
        setNorthStar(ns)
        setProducts(p)
      } catch (err) {
        console.error('Failed to load overview data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [days])

  if (!loading && (!metrics || !northStar)) return <RequestError />
  if (loading || !metrics || !northStar) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
        <p className="mt-3 text-xs text-charcoal-500 font-medium">Aggregating live commerce metrics...</p>
      </div>
    )
  }

  const kpiCards = [
    {
      label: 'Gross Merchandise Revenue',
      value: `₹${metrics.total_revenue.toLocaleString('en-IN')}`,
      sub: `Across ${metrics.total_orders} completed orders`,
      icon: DollarSign,
      color: 'text-brand bg-brand-muted',
    },
    {
      label: 'Average Order Value (AOV)',
      value: `₹${metrics.average_order_value.toLocaleString('en-IN')}`,
      sub: 'Basket size efficiency',
      icon: ShoppingCart,
      color: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'Session Conversion Rate',
      value: `${metrics.conversion_rate}%`,
      sub: `${metrics.total_sessions} monitored sessions`,
      icon: TrendingUp,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Cart Abandonment Rate',
      value: `${metrics.cart_abandonment_rate}%`,
      sub: 'Drop-off between add & checkout',
      icon: Percent,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Product Return Rate',
      value: `${metrics.return_rate}%`,
      sub: 'Monitored across size/quality',
      icon: RotateCcw,
      color: 'text-rose-700 bg-rose-50',
    },
    {
      label: 'Repeat Customer Rate',
      value: `${metrics.repeat_customer_rate}%`,
      sub: 'Multi-order customer retention',
      icon: Users,
      color: 'text-purple-700 bg-purple-50',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
            Executive Product Intelligence
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Aggregated business and consumer funnel performance metrics computed from transactional logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Window:
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

      {/* North Star Metric Card */}
      <div className="bg-gradient-to-r from-charcoal-900 via-charcoal-800 to-charcoal-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-charcoal-700 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-charcoal-700 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand text-white text-xs font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>North Star Metric</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mt-2">
              {northStar.north_star_name}
            </h2>
            <p className="text-xs text-cream-300 mt-1 max-w-xl font-light">
              {northStar.metric_tree_description}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-5xl sm:text-6xl font-serif font-bold text-brand-accent">
              {northStar.north_star_value}
            </span>
            <span className="text-xs text-cream-400 block mt-1">Sessions Concluded with Order</span>
          </div>
        </div>

        {/* Supporting Metric Tree */}
        <div>
          <span className="text-xs font-semibold text-cream-300 uppercase tracking-widest block mb-3">
            Core Driver Tree Breakdown:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-charcoal-800/80 p-3.5 rounded-xl border border-charcoal-700">
              <span className="text-cream-400 block text-[11px]">1. Discovery Engagement</span>
              <span className="text-lg font-bold text-white mt-1 block">
                {northStar.supporting_metrics.discovery_engagement_sessions} sessions
              </span>
            </div>
            <div className="bg-charcoal-800/80 p-3.5 rounded-xl border border-charcoal-700">
              <span className="text-cream-400 block text-[11px]">2. Product Relevance Views</span>
              <span className="text-lg font-bold text-white mt-1 block">
                {northStar.supporting_metrics.product_relevance_view_sessions} sessions
              </span>
            </div>
            <div className="bg-charcoal-800/80 p-3.5 rounded-xl border border-charcoal-700">
              <span className="text-cream-400 block text-[11px]">3. Cart Intent Conversion</span>
              <span className="text-lg font-bold text-white mt-1 block">
                {northStar.supporting_metrics.cart_addition_sessions} sessions
              </span>
            </div>
            <div className="bg-charcoal-800/80 p-3.5 rounded-xl border border-charcoal-700">
              <span className="text-cream-400 block text-[11px]">4. Cart-to-Purchase Ratio</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">
                {northStar.supporting_metrics.purchase_to_cart_ratio}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm flex items-start justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className="text-2xl font-bold text-charcoal-900 font-editorial">
                  {kpi.value}
                </div>
                <p className="text-[11px] text-charcoal-400">{kpi.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Top Performing Catalogue Products Table */}
      <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200 pb-4">
          <div>
            <h3 className="text-base font-serif font-bold text-charcoal-900">
              Product SKU Performance Matrix
            </h3>
            <p className="text-xs text-charcoal-500">
              Aggregated views, adds to cart, sales conversion, and return rate per item.
            </p>
          </div>
          <span className="text-xs font-semibold text-charcoal-500">
            Top {products.length} Revenue Leaders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-charcoal-700">
            <thead className="bg-cream-50 text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold border-b border-cream-200">
              <tr>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Views</th>
                <th className="py-3 px-3 text-right">Cart Adds</th>
                <th className="py-3 px-3 text-right">Orders</th>
                <th className="py-3 px-3 text-right">Conv Rate</th>
                <th className="py-3 px-3 text-right">Revenue (₹)</th>
                <th className="py-3 px-3 text-right">Return Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {products.map((item) => (
                <tr key={item.product_id} className="hover:bg-cream-50/80 transition-colors">
                  <td className="py-3 px-3 font-medium text-charcoal-900 max-w-[220px] truncate">
                    {item.name}
                  </td>
                  <td className="py-3 px-3 text-charcoal-500">{item.category}</td>
                  <td className="py-3 px-3 text-right font-mono">{item.views}</td>
                  <td className="py-3 px-3 text-right font-mono">{item.adds_to_cart}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold">{item.purchases}</td>
                  <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                    {item.conversion_rate}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-charcoal-900">
                    ₹{item.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span className={`px-2 py-0.5 rounded ${item.return_rate > 15 ? 'bg-red-50 text-red-700 font-semibold' : 'text-charcoal-600'}`}>
                      {item.return_rate}%
                    </span>
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
