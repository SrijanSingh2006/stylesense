import React, { useState } from 'react'
import { User, Sparkles, Tag, Palette, DollarSign, RotateCcw, Check } from 'lucide-react'
import { useUserStore } from '../../store/useUserStore'

export const AccountDemoPage: React.FC = () => {
  const { currentUser, setCurrentUser, sessionId, resetSession } = useUserStore()
  const [savedNotice, setSavedNotice] = useState(false)

  // Local editable form state
  const [displayName, setDisplayName] = useState(currentUser.display_name)
  const [budgetMin, setBudgetMin] = useState(currentUser.budget_min)
  const [budgetMax, setBudgetMax] = useState(currentUser.budget_max)
  const [categories, setCategories] = useState(currentUser.preferred_categories.join(', '))
  const [colours, setColours] = useState(currentUser.preferred_colours.join(', '))
  const [brands, setBrands] = useState(currentUser.preferred_brands.join(', '))

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentUser({
      ...currentUser,
      display_name: displayName,
      budget_min: Number(budgetMin),
      budget_max: Number(budgetMax),
      preferred_categories: categories.split(',').map((s) => s.trim()).filter(Boolean),
      preferred_colours: colours.split(',').map((s) => s.trim()).filter(Boolean),
      preferred_brands: brands.split(',').map((s) => s.trim()).filter(Boolean),
    })
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand uppercase tracking-wider">
          <User className="w-4 h-4" />
          <span>Demo Customer Context</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-charcoal-900 mt-1">
          Shopper Profile & AI Preferences
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Configure this demo shopper persona to observe real-time recommendation and funnel shifts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-muted text-brand font-bold text-2xl flex items-center justify-center font-editorial">
            {currentUser.display_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-bold text-charcoal-900">{currentUser.display_name}</h2>
            <span className="text-xs text-charcoal-400">Customer ID: #{currentUser.id}</span>
          </div>

          <div className="pt-3 border-t border-cream-200 text-xs space-y-2 text-charcoal-600">
            <div>
              <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block">
                Session Identifier
              </span>
              <span className="font-mono text-[11px] text-charcoal-800 break-all">{sessionId}</span>
            </div>
            <button
              onClick={resetSession}
              className="text-xs text-brand hover:underline font-semibold flex items-center gap-1 pt-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Simulate New Session</span>
            </button>
          </div>
        </div>

        {/* Editable Preferences Form */}
        <div className="md:col-span-2 p-6 bg-white rounded-2xl border border-cream-300 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-sm font-bold text-charcoal-900 border-b border-cream-200 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Personalisation Signal Weights</span>
            </h3>

            <div>
              <label htmlFor="accountdemo-field-1" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Display Name
              </label>
              <input id="accountdemo-field-1"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2.5 text-xs bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="accountdemo-field-2" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Budget Minimum (₹)
                </label>
                <input id="accountdemo-field-2"
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  className="w-full p-2.5 text-xs bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                />
              </div>
              <div>
                <label htmlFor="accountdemo-field-3" className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Budget Maximum (₹)
                </label>
                <input id="accountdemo-field-3"
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full p-2.5 text-xs bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="accountdemo-field-4" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Preferred Categories (comma-separated)
              </label>
              <input id="accountdemo-field-4"
                type="text"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className="w-full p-2.5 text-xs bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
              />
            </div>

            <div>
              <label htmlFor="accountdemo-field-5" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Preferred Colours (comma-separated)
              </label>
              <input id="accountdemo-field-5"
                type="text"
                value={colours}
                onChange={(e) => setColours(e.target.value)}
                className="w-full p-2.5 text-xs bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
              />
            </div>

            <div>
              <label htmlFor="accountdemo-field-6" className="block text-xs font-semibold text-charcoal-700 mb-1">
                Preferred Brands (comma-separated)
              </label>
              <input id="accountdemo-field-6"
                type="text"
                value={brands}
                onChange={(e) => setBrands(e.target.value)}
                className="w-full p-2.5 text-xs bg-cream-50 border border-cream-300 rounded-lg text-charcoal-800"
              />
            </div>

            <div className="pt-3 flex items-center justify-between">
              {savedNotice && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Persona updated! Recommendations re-ranked.
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl shadow transition-colors"
              >
                Apply Style Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
