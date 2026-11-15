import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore, homeFor } from "../../auth/state";
import { api } from "../../services/api";
import { signOut } from "../../services/auth";
import { errorMessage } from "../../services/errors";
export function AccountLayout() {
  const user = useAuthStore((s) => s.user)!,
    navigate = useNavigate(),
    [error, setError] = useState("");
  const notifications = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: async () => (await api.get("/users/me/notifications")).data,
    refetchInterval: 30000,
  });
  const customer = user.role === "customer";
  const links = [
    ["Overview", "/account"],
    ["Profile", "/account/profile"],
    ...(customer
      ? [
          ["Orders", "/account/orders"],
          ["Wishlist", "/account/wishlist"],
          ["Addresses", "/account/addresses"],
          ["Preferences", "/account/preferences"],
        ]
      : []),
    ["Security & sessions", "/account/security"],
    [
      `Notifications (${notifications.data?.unread_count ?? 0})`,
      "/account/notifications",
    ],
  ];
  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900">
      <header className="bg-white border-b border-cream-300 px-5 sm:px-9 py-5 flex items-center justify-between gap-4 flex-wrap">
        <Link to="/" className="font-serif text-xl tracking-widest">
          STYLESENSE
        </Link>
        <div className="flex gap-4 items-center text-sm">
          <span>{user.full_name}</span>
          {!customer && (
            <Link className="text-brand underline" to={homeFor(user)}>
              My workspace
            </Link>
          )}
          <button
            onClick={async () => {
              try {
                await signOut();
                navigate("/login");
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
            className="text-brand underline"
          >
            Sign out
          </button>
        </div>
      </header>
      {error && (
        <p role="alert" className="p-4 text-red-800">
          {error}
        </p>
      )}
      <div className="max-w-7xl mx-auto p-5 sm:p-9 grid md:grid-cols-[220px_minmax(0,1fr)] gap-8">
        <aside>
          <p className="uppercase text-xs text-charcoal-500 tracking-wider mb-3">
            Your account
          </p>
          <nav className="flex md:flex-col flex-wrap gap-2">
            {links.map(([label, path]) => (
              <NavLink
                key={path}
                end={path === "/account"}
                to={path}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2.5 text-sm ${isActive ? "bg-brand text-white" : "bg-white hover:bg-cream-200"}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
