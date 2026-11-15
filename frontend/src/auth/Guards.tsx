import React from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuthStore, can, homeFor } from "./state";
export function ProtectedRoute({ permission }: { permission?: string }) {
  const { user, status } = useAuthStore();
  const location = useLocation();
  if (status === "restoring")
    return (
      <div role="status" className="p-12 text-center">
        Restoring your secure session…
      </div>
    );
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (permission && !can(user, permission))
    return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}
export function GuestRoute() {
  const { user, status } = useAuthStore();
  if (status === "restoring")
    return (
      <div role="status" className="p-12 text-center">
        Restoring your session…
      </div>
    );
  return user ? <Navigate to={homeFor(user)} replace /> : <Outlet />;
}
export function UnauthorizedPage() {
  return (
    <main className="max-w-xl mx-auto p-12 space-y-4">
      <h1 className="text-3xl font-serif">Access not permitted</h1>
      <p>Your account does not have permission for this workspace.</p>
      <Link to="/account" className="text-brand underline">
        Go to your account
      </Link>
    </main>
  );
}
