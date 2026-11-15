import React, { useEffect, useState } from 'react'
import { Percent, TrendingUp, DollarSign, Calculator, AlertCircle, Info, Sparkles } from 'lucide-react'
import { fetchProducts, simulatePromotion } from '../../services/api'
import type { Product, PromotionSimulateResponse } from '../../types'

export const PricingPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<number>(101)
  const [discountPct, setDiscountPct] = useState<number>(20)
  const [elasticity, setElasticity] = useState<number>(-1.8)
  const [costPerUnit, setCostPerUnit] = useState<number | ''>('')
  const [simulation, setSimulation] = useState<PromotionSimulateResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProds = async () => {
      try {
        const res = await fetchProducts({ limit: 40 })
        setProducts(res.items)
        if (res.items.length > 0) {
          setSelectedProductId(res.items[0].id)
        }
      } catch (err) {
        console.error('Failed to load products for simulator:', err)
      }
    }
    loadProds()
  }, [])

  const runSimulation = async () => {
    setLoading(true)
    try {
      const res = await simulatePromotion({
        product_id: selectedProductId,
        discount_percentage: Number(discountPct),
        price_elasticity: Number(elasticity),
        estimated_cost_per_unit: costPerUnit !== '' ? Number(costPerUnit) : undefined,
      })
      setSimulation(res)
    } catch (err) {
      console.error('Promotion simulation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProductId) {
      runSimulation()
    }
  }, [selectedProductId, discountPct, elasticity, costPerUnit])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900">
          Promotion & Markdown Price Elasticity Simulator
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Model demand elasticity, projected gross margin tradeoffs, and unit velocity prior to commercial campaign rollouts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-5 p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-charcoal-900 border-b border-cream-200 pb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-brand" />
            <span>Scenario Simulation Parameters</span>
          </h2>

          {/* Product selector */}
          <div>
            <label htmlFor="pricing-field-1" className="block text-xs font-semibold text-charcoal-700 mb-1">
              Target Product SKU
            </label>
            <select id="pricing-field-1"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium text-charcoal-800"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Base ₹{p.price})
                </option>
              ))}
            </select>
          </div>

          {/* Discount Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-charcoal-700 mb-1">
              <span>Proposed Markdown / Discount</span>
              <span className="font-bold text-brand">{discountPct}% OFF</span>
            </div>
            <input
              type="range" aria-label="Discount percentage"
              min="0"
              max="70"
              step="5"
              value={discountPct}
              onChange={(e) => setDiscountPct(Number(e.target.value))}
              className="w-full accent-brand h-2 bg-cream-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-charcoal-400 mt-1">
              <span>0% (Full Price)</span>
              <span>35%</span>
              <span>70% (Clearance)</span>
            </div>
          </div>

          {/* Elasticity Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-charcoal-700 mb-1">
              <span>Assumed Price Elasticity (Ed)</span>
              <span className="font-mono font-bold text-charcoal-900">{elasticity}</span>
            </div>
            <input
              type="range" aria-label="Price elasticity"
              min="-3.0"
              max="-0.8"
              step="0.1"
              value={elasticity}
              onChange={(e) => setElasticity(Number(e.target.value))}
              className="w-full accent-brand h-2 bg-cream-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-charcoal-400 mt-1">
              <span>-0.8 (Inelastic)</span>
              <span>-1.8 (Fashion Normal)</span>
              <span>-3.0 (Highly Elastic)</span>
            </div>
          </div>

          {/* Unit Cost Override */}
          <div>
            <label htmlFor="pricing-field-2" className="block text-xs font-semibold text-charcoal-700 mb-1">
              Estimated Unit Cost (COGS in ₹, optional)
            </label>
            <input id="pricing-field-2"
              type="number"
              placeholder="Default 42% of baseline price"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-2.5 bg-cream-50 border border-cream-300 rounded-xl text-xs text-charcoal-800"
            />
          </div>

          <div className="p-3.5 bg-cream-100 rounded-xl text-[11px] text-charcoal-600 leading-relaxed border border-cream-200">
            <span className="font-semibold text-charcoal-800 block mb-1">Model Assumption:</span>
            Using standard Marshallian economic elasticity formula: <code>% Δ Q = Elasticity × % Δ P</code>.
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {simulation ? (
            <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-6">
              <div className="border-b border-cream-200 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">
                  Simulation Outcome
                </span>
                <h3 className="text-xl font-serif font-bold text-charcoal-900 mt-1">
                  {simulation.product_name}
                </h3>
              </div>

              {/* Baseline vs Scenario Comparison Matrix */}
              <div className="grid grid-cols-2 gap-4">
                {/* Baseline */}
                <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 space-y-3">
                  <span className="text-xs font-bold text-charcoal-600 uppercase tracking-wider block">
                    Current Baseline
                  </span>
                  <div>
                    <span className="text-2xl font-bold text-charcoal-900 font-editorial">
                      ₹{simulation.baseline_price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-charcoal-500 block">Selling Price</span>
                  </div>
                  <div className="pt-2 border-t border-cream-200 text-xs text-charcoal-600 space-y-1 font-mono">
                    <div>Volume: <strong>{simulation.baseline_units_per_month}</strong> units/mo</div>
                    <div>Revenue: <strong>₹{simulation.baseline_revenue.toLocaleString('en-IN')}</strong></div>
                    <div>Gross Margin: <strong>{simulation.baseline_gross_margin_pct}%</strong></div>
                  </div>
                </div>

                {/* Scenario Projected */}
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Modelled Scenario
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded shadow-sm">
                      {simulation.discount_percentage}% OFF
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-emerald-900 font-editorial">
                      ₹{simulation.scenario_selling_price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-emerald-700 block">Simulated Price</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200 text-xs text-emerald-950 space-y-1 font-mono">
                    <div>Projected Vol: <strong>{simulation.scenario_estimated_units}</strong> units</div>
                    <div>Projected Rev: <strong>₹{simulation.scenario_projected_revenue.toLocaleString('en-IN')}</strong></div>
                    <div>Gross Margin: <strong>{simulation.scenario_gross_margin_pct}%</strong></div>
                  </div>
                </div>
              </div>

              {/* Deltas Callout */}
              <div className="grid grid-cols-2 gap-4 font-mono text-center">
                <div className="p-3 bg-cream-100 rounded-xl">
                  <span className="text-[10px] text-charcoal-500 block uppercase">Projected Revenue Lift</span>
                  <span className={`text-lg font-bold ${simulation.revenue_delta_pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {simulation.revenue_delta_pct >= 0 ? '+' : ''}{simulation.revenue_delta_pct}%
                  </span>
                </div>
                <div className="p-3 bg-cream-100 rounded-xl">
                  <span className="text-[10px] text-charcoal-500 block uppercase">Gross Profit Impact</span>
                  <span className={`text-lg font-bold ${simulation.profit_delta_pct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {simulation.profit_delta_pct >= 0 ? '+' : ''}{simulation.profit_delta_pct}%
                  </span>
                </div>
              </div>

              {/* Prominent Assumptions Notice */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Merchandising Disclaimer:</strong> {simulation.assumptions_notice}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-cream-300 text-xs text-charcoal-500">
              Select product and parameters to run pricing projection.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
