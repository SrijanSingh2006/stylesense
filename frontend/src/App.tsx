import { ProtectedRoute, GuestRoute, UnauthorizedPage } from "./auth/Guards";
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  VerifyEmailPage,
  TokenPasswordPage,
  TermsPage,
} from "./pages/Auth/AuthPages";
import { AccountLayout } from "./pages/Account/AccountLayout";
import {
  AccountOverview,
  ProfilePage,
  OrdersPage,
  OrderDetailPage,
  NotificationsPage,
} from "./pages/Account/AccountPages";
import { AddressesPage } from "./pages/Account/Addresses";
import { PreferencesPage } from "./pages/Account/Preferences";
import { SecurityPage } from "./pages/Account/Security";
import {
  AdminLayout,
  AdminOverview,
  AdminUsersPage,
  AdminUserDetail,
  InvitationsPage,
  AuditPage,
  SystemSettingsPage,
} from "./pages/Admin/AdminPages";
import React from "react";
import { WishlistPage } from "./pages/Storefront/Wishlist";
import { ApiStatus, RouteErrorBoundary } from "./components/ui/ApiStatus";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { StorefrontLayout } from "./layouts/StorefrontLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";

// Storefront pages
import { HomePage } from "./pages/Storefront/Home";
import { DiscoverPage } from "./pages/Storefront/Discover";
import { ProductDetailPage } from "./pages/Storefront/ProductDetail";
import { SearchResultsPage } from "./pages/Storefront/SearchResults";
import { CartPage } from "./pages/Storefront/Cart";

// Product Intelligence Dashboard pages
import { OverviewPage } from "./pages/Analytics/Overview";
import { FunnelPage } from "./pages/Analytics/Funnel";
import { ExperimentListPage } from "./pages/Experiments/ExperimentList";
import { SegmentationPage } from "./pages/Analytics/Segmentation";

// Business Operations pages
import { InventoryPage } from "./pages/Operations/Inventory";
import { ReturnsPage } from "./pages/Operations/Returns";
import { CataloguePage } from "./pages/Operations/Catalogue";
import { PricingPage } from "./pages/Operations/Pricing";
import { RoadmapPage } from "./pages/Operations/Roadmap";
import { ReleasesPage } from "./pages/Operations/Releases";
import { FeedbackPage } from "./pages/Operations/Feedback";
import { SettingsPage } from "./pages/Operations/Settings";

export function App() {
  return (
    <RouteErrorBoundary>
      <ApiStatus />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<TokenPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/accept-invitation"
          element={<TokenPasswordPage invitation />}
        />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route element={<ProtectedRoute permission="wishlist.manage" />}>
            <Route path="/wishlist" element={<WishlistPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route
            path="/account/demo"
            element={<Navigate to="/account" replace />}
          />
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountOverview />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route element={<ProtectedRoute permission="orders.read_own" />}>
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="addresses.manage" />}>
              <Route path="addresses" element={<AddressesPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="preferences.manage" />}>
              <Route path="preferences" element={<PreferencesPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="wishlist.manage" />}>
              <Route path="wishlist" element={<WishlistPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute permission="preferences.manage" />}>
            <Route path="/onboarding" element={<AccountLayout />}>
              <Route index element={<PreferencesPage onboarding />} />
            </Route>
          </Route>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route element={<ProtectedRoute permission="analytics.read" />}>
              <Route index element={<OverviewPage />} />
              <Route path="analytics" element={<FunnelPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="experiments.manage" />}>
              <Route path="experiments" element={<ExperimentListPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="segments.read" />}>
              <Route path="segments" element={<SegmentationPage />} />
            </Route>
          </Route>
          <Route path="/operations" element={<DashboardLayout />}>
            <Route
              index
              element={<Navigate to="/operations/inventory" replace />}
            />
            <Route element={<ProtectedRoute permission="inventory.read" />}>
              <Route path="inventory" element={<InventoryPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="returns.read" />}>
              <Route path="returns" element={<ReturnsPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="catalogue.manage" />}>
              <Route path="catalogue" element={<CataloguePage />} />
            </Route>
            <Route element={<ProtectedRoute permission="pricing.simulate" />}>
              <Route path="pricing" element={<PricingPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="roadmap.manage" />}>
              <Route path="roadmap" element={<RoadmapPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="releases.read" />}>
              <Route path="releases" element={<ReleasesPage />} />
            </Route>
            <Route element={<ProtectedRoute permission="feedback.manage" />}>
              <Route path="feedback" element={<FeedbackPage />} />
            </Route>
            <Route
              element={<ProtectedRoute permission="feature_flags.manage" />}
            >
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute permission="users.manage" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:id" element={<AdminUserDetail />} />
              <Route path="invitations" element={<InvitationsPage />} />
              <Route path="audit-logs" element={<AuditPage />} />
              <Route path="settings" element={<SystemSettingsPage />} />
            </Route>
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center p-6 bg-cream-100 text-center">
              <div className="space-y-4">
                <span className="text-6xl font-serif text-brand">404</span>
                <h1 className="text-2xl font-serif">Page Not Found</h1>
                <Link to="/" className="text-brand underline">
                  Return to Storefront
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </RouteErrorBoundary>
  );
}
export default App;
