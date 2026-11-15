import { errorMessage } from '../../services/errors'
import { RequestError } from '../../components/ui/RequestError'
import React, { useEffect, useState } from 'react'
import {
  Boxes,
  AlertTriangle,
  TrendingDown,
  PlusCircle,
  Clock,
  CheckCircle2,
  X,
  Package,
} from 'lucide-react'
import {
  fetchInventory,
  fetchInventoryForecast,
  createInventoryMovement,
} from '../../services/api'
import type { InventoryOverview, InventoryForecast, InventoryAlertItem } from '../../types'

export const InventoryPage: React.FC = () => {
  const [data, setData] = useState<InventoryOverview | null>(null)
  const [forecastModal, setForecastModal] = useState<InventoryForecast | null>(null)
  const [restockModalItem, setRestockModalItem] = useState<InventoryAlertItem | null>(null)
  const [restockQty, setRestockQty] = useState(50)
  const [loading, setLoading] = useState(true)
  const [submittingRestock, setSubmittingRestock] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchInventory()
      setData(res)
    } catch (err) {
      console.error('Failed to load inventory data:')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleOpenForecast = async (productId: number) => {
    try {
      const fc = await fetchInventoryForecast(productId)
      setForecastModal(fc)
    } catch (err) {
      console.error('Failed to fetch forecast:')
    }
  }

  const handleExecuteRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restockModalItem) return
    setSubmittingRestock(true)
    try {
      await createInventoryMovement({
        product_id: restockModalItem.product_id,
        movement_type: 'RESTOCK',
        quantity: Number(restockQty),
        reference: `PO-Inbound-${Date.now().toString().slice(-4)}`,
      })
      setRestockModalItem(null)
      load()
    } catch (err: any) {
      alert(errorMessage(err))
    } finally {
      setSubmittingRestock(false)
    }
  }

  if (!loading && (!data)) return <RequestError />
  if (loading || !data) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
        <p className="mt-3 text-xs text-charcoal-500 font-medium">Loading inventory balance & stock coverage...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
          Inventory Intelligence & Demand Forecasting
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Stock velocity monitoring, moving-average depletion projections, and transactional replenishment tracking.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Total Active SKUs
          </span>
          <div className="text-2xl font-bold text-charcoal-900 font-editorial">
            {data.total_skus}
          </div>
          <span className="text-[11px] text-charcoal-400">100% in local database</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Total Units in Stock
          </span>
          <div className="text-2xl font-bold text-charcoal-900 font-editorial">
            {data.total_inventory_units.toLocaleString()}
          </div>
          <span className="text-[11px] text-charcoal-400">Available physical inventory</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Inventory Valuation
          </span>
          <div className="text-2xl font-bold text-brand font-editorial">
            ₹{data.total_inventory_valuation.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-charcoal-400">At current catalogue retail price</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Turnover Ratio
          </span>
          <div className="text-2xl font-bold text-emerald-700 font-editorial">
            {data.inventory_turnover_ratio}x
          </div>
          <span className="text-[11px] text-charcoal-400">Healthy replenishment cycle</span>
        </div>
      </div>

      {/* Low Stock Alerts Table */}
      <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-serif font-bold text-charcoal-900">
                Replenishment Threshold & Stockout Alerts ({data.alerts.length})
              </h3>
              <p className="text-xs text-charcoal-500">
                Items currently at or below minimum reorder thresholds.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-50 text-[11px] uppercase tracking-wider text-charcoal-500 font-semibold border-b border-cream-200">
              <tr>
                <th className="py-3 px-3">Product SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">Reorder Point</th>
                <th className="py-3 px-3 text-right">Stock Coverage</th>
                <th className="py-3 px-3">Alert Status</th>
                <th className="py-3 px-3 text-right">Recommended PO</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {data.alerts.map((alert) => (
                <tr key={alert.product_id} className="hover:bg-cream-50/70 transition-colors">
                  <td className="py-3 px-3 font-medium text-charcoal-900 max-w-[200px] truncate">
                    {alert.name}
                  </td>
                  <td className="py-3 px-3 text-charcoal-500">{alert.category}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-charcoal-900">
                    {alert.current_stock} units
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-charcoal-500">
                    {alert.reorder_point}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-amber-700 font-semibold">
                    {alert.stock_coverage_days} days
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.status === 'OUT_OF_STOCK'
                          ? 'bg-red-100 text-red-800'
                          : alert.status === 'CRITICAL_LOW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-cream-200 text-charcoal-700'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-brand">
                    +{alert.recommended_reorder_qty} units
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => handleOpenForecast(alert.product_id)}
                      className="text-xs text-brand hover:underline font-semibold"
                    >
                      Forecast
                    </button>
                    <button
                      onClick={() => {
                        setRestockModalItem(alert)
                        setRestockQty(alert.recommended_reorder_qty)
                      }}
                      className="px-2.5 py-1 bg-brand hover:bg-brand-dark text-white text-[11px] font-semibold rounded-lg shadow-sm"
                    >
                      Replenish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demand Forecast Modal */}
      {forecastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-cream-300 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold text-charcoal-900 font-editorial">
                  Moving Average Demand Forecast
                </h3>
              </div>
              <button
                onClick={() => setForecastModal(null)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <span className="font-bold text-charcoal-900 text-sm block">
                {forecastModal.product_name}
              </span>

              <div className="grid grid-cols-2 gap-3 p-4 bg-cream-50 rounded-xl border border-cream-200 font-mono">
                <div>
                  <span className="text-charcoal-500 block text-[11px]">DAILY RUN RATE</span>
                  <span className="text-base font-bold text-charcoal-900">
                    {forecastModal.daily_run_rate_units} units / day
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-500 block text-[11px]">DAYS TO STOCKOUT</span>
                  <span className="text-base font-bold text-amber-700">
                    {forecastModal.days_until_stockout} days
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-charcoal-700 block mb-1">
                  Historical Weekly Sales (Last 4 Weeks)
                </span>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  {forecastModal.historical_weekly_sales.map((sales, i) => (
                    <div key={i} className="p-2 bg-cream-100 rounded-lg">
                      <span className="text-[10px] text-charcoal-400 block">Wk {i + 1}</span>
                      <span className="font-bold text-charcoal-800">{sales} sold</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-brand-muted rounded-xl text-brand text-xs font-semibold">
                Recommended Inbound Restock Order: +{forecastModal.recommended_po_quantity} units
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Transaction Modal */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-cream-300 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <h3 className="text-sm font-bold text-charcoal-900 font-editorial">
                Record Inbound Restock Movement
              </h3>
              <button
                onClick={() => setRestockModalItem(null)}
                className="text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="space-y-4 text-xs">
              <p className="text-charcoal-600">
                Executing a transactional restock will update physical warehouse stock in the database.
              </p>

              <div>
                <label htmlFor="inventory-field-1" className="block font-semibold text-charcoal-700 mb-1">Product</label>
                <input id="inventory-field-1"
                  type="text"
                  disabled
                  value={restockModalItem.name}
                  className="w-full p-2.5 bg-cream-100 border border-cream-300 rounded-lg text-charcoal-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="inventory-field-2" className="block font-semibold text-charcoal-700 mb-1">Replenishment Quantity (Units)</label>
                <input id="inventory-field-2"
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800 font-mono font-bold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="px-4 py-2 border border-cream-300 text-charcoal-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRestock}
                  className="px-5 py-2 bg-brand text-white font-semibold rounded-xl shadow"
                >
                  {submittingRestock ? 'Committing Transaction...' : 'Commit Stock Inbound'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
