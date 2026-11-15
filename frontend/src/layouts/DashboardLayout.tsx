import React, { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  FlaskConical,
  Users,
  Boxes,
  RotateCcw,
  CheckSquare,
  Percent,
  GitPullRequest,
  Rocket,
  MessageSquare,
  Settings,
  Store,
  ChevronRight,
  Menu,
  X,
  Sparkles,
} from 'lucide-react'

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const location = useLocation()

  const navGroups = [
    {
      title: 'Product Intelligence',
      links: [
        { label: 'Executive Overview', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Funnel & Cohorts', path: '/dashboard/analytics', icon: TrendingUp },
        { label: 'A/B Experiments', path: '/dashboard/experiments', icon: FlaskConical },
        { label: 'RFM Segmentation', path: '/dashboard/segments', icon: Users },
      ],
    },
    {
      title: 'Business Operations',
      links: [
        { label: 'Inventory Intelligence', path: '/operations/inventory', icon: Boxes },
        { label: 'Return Intelligence', path: '/operations/returns', icon: RotateCcw },
        { label: 'Catalogue Quality', path: '/operations/catalogue', icon: CheckSquare },
        { label: 'Promotion Simulator', path: '/operations/pricing', icon: Percent },
        { label: 'RICE Product Roadmap', path: '/operations/roadmap', icon: GitPullRequest },
        { label: 'Launch Readiness', path: '/operations/releases', icon: Rocket },
        { label: 'Stakeholder Feedback', path: '/operations/feedback', icon: MessageSquare },
        { label: 'Feature Flags & Config', path: '/operations/settings', icon: Settings },
      ],
    },
  ]

  return (
    <div className="min-h-screen flex bg-cream-100 text-charcoal-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-900/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-charcoal-900 text-cream-200 border-r border-charcoal-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-charcoal-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-serif font-bold text-white tracking-tight">
              STYLESENSE
            </span>
            <span className="text-[9px] font-sans font-semibold tracking-wider uppercase bg-brand text-white px-1.5 py-0.5 rounded">
              INTEL
            </span>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1 text-charcoal-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {navGroups.map((grp) => (
            <div key={grp.title}>
              <div className="px-3 text-[10px] font-bold text-charcoal-400 uppercase tracking-widest mb-2">
                {grp.title}
              </div>
              <nav className="space-y-1">
                {grp.links.map((item) => {
                  const Icon = item.icon
                  const active = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? 'bg-brand text-white font-semibold shadow-md'
                          : 'text-cream-300 hover:bg-charcoal-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-charcoal-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                    </Link>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Link to Storefront */}
        <div className="p-4 border-t border-charcoal-800">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-charcoal-800 hover:bg-charcoal-700 text-cream-200 text-xs font-medium rounded-xl border border-charcoal-700 transition-colors"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Open Customer Storefront</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-cream-300 h-16 px-4 sm:px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-charcoal-600 hover:text-charcoal-900 rounded-lg hover:bg-cream-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-charcoal-500 font-medium hidden sm:inline">
                StyleSense Intelligence Platform
              </span>
              <span className="text-xs text-charcoal-300 hidden sm:inline">/</span>
              <span className="text-xs font-semibold text-charcoal-900">
                {navGroups.flatMap(g => g.links).find(l => l.path === location.pathname)?.label || 'Console'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Database Connected</span>
            </div>

            <Link
              to="/"
              className="text-xs font-medium text-brand hover:underline px-2 py-1"
            >
              View Storefront →
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
