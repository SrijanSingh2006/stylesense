import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { StorefrontLayout } from './layouts/StorefrontLayout'
import { DashboardLayout } from './layouts/DashboardLayout'

// Storefront pages
import { HomePage } from './pages/Storefront/Home'
import { DiscoverPage } from './pages/Storefront/Discover'
import { ProductDetailPage } from './pages/Storefront/ProductDetail'
import { SearchResultsPage } from './pages/Storefront/SearchResults'
import { CartPage } from './pages/Storefront/Cart'
import { AccountDemoPage } from './pages/Storefront/AccountDemo'

// Product Intelligence Dashboard pages
import { OverviewPage } from './pages/Analytics/Overview'
import { FunnelPage } from './pages/Analytics/Funnel'
import { ExperimentListPage } from './pages/Experiments/ExperimentList'
import { SegmentationPage } from './pages/Analytics/Segmentation'

// Business Operations pages
import { InventoryPage } from './pages/Operations/Inventory'
import { ReturnsPage } from './pages/Operations/Returns'
import { CataloguePage } from './pages/Operations/Catalogue'
import { PricingPage } from './pages/Operations/Pricing'
import { RoadmapPage } from './pages/Operations/Roadmap'
import { ReleasesPage } from './pages/Operations/Releases'
import { FeedbackPage } from './pages/Operations/Feedback'
import { SettingsPage } from './pages/Operations/Settings'

export function App() {
  return (
    <Routes>
      {/* Customer Storefront Routes */}
      <Route element={<StorefrontLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/account/demo" element={<AccountDemoPage />} />
      </Route>

      {/* Product Intelligence Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="analytics" element={<FunnelPage />} />
        <Route path="experiments" element={<ExperimentListPage />} />
        <Route path="segments" element={<SegmentationPage />} />
      </Route>

      {/* Business Operations Dashboard Routes */}
      <Route path="/operations" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/operations/inventory" replace />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="returns" element={<ReturnsPage />} />
        <Route path="catalogue" element={<CataloguePage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="roadmap" element={<RoadmapPage />} />
        <Route path="releases" element={<ReleasesPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Route */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center p-6 bg-cream-100 text-charcoal-900 text-center">
            <div className="space-y-4 max-w-md">
              <span className="text-6xl font-serif font-bold text-brand">404</span>
              <h1 className="text-2xl font-serif font-bold">Page Not Found</h1>
              <p className="text-xs text-charcoal-500">
                The requested URL does not exist in the StyleSense platform.
              </p>
              <Link
                to="/"
                className="inline-block px-5 py-2.5 bg-brand text-white text-xs font-semibold rounded-xl shadow"
              >
                Return to Storefront
              </Link>
            </div>
          </div>
        }
      />
    </Routes>
  )
}
export default App
