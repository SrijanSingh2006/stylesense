import React, { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useAuthStore, type AccountUser } from "../../auth/state";
import { signOut } from "../../services/auth";
import { errorMessage } from "../../services/errors";
import { fieldClass } from "../Auth/AuthPages";
import { panel, button, LoadState } from "../Account/shared";
const roles = ["customer", "product_manager", "operations_manager", "admin"];
const statuses = ["pending_verification", "active", "suspended", "deactivated"];
export function AdminLayout() {
  const navigate = useNavigate(),
    [error, setError] = useState("");
  return (
    <div className="min-h-screen bg-cream-100 text-charcoal-900">
      <header className="bg-charcoal-900 text-white px-5 sm:px-9 py-5 flex flex-wrap justify-between gap-4">
        <Link to="/" className="font-serif text-xl tracking-widest">
          STYLESENSE <span className="text-xs text-emerald-300">ADMIN</span>
        </Link>
        <div className="flex gap-4 text-sm">
          <Link to="/account/security">My security</Link>
          <button
            onClick={async () => {
              try {
                await signOut();
                navigate("/login");
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
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
      <div className="max-w-7xl mx-auto p-5 sm:p-9 grid md:grid-cols-[200px_minmax(0,1fr)] gap-7">
        <nav className="flex flex-wrap md:flex-col gap-2 items-start">
          {[
            ["Overview", "/admin"],
            ["Users", "/admin/users"],
            ["Staff invitations", "/admin/invitations"],
            ["Audit logs", "/admin/audit-logs"],
            ["System settings", "/admin/settings"],
          ].map(([label, path]) => (
            <NavLink
              key={path}
              end={path === "/admin"}
              to={path}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-xl text-sm ${isActive ? "bg-brand text-white" : "bg-white text-charcoal-700"}`
              }
            >
              {label}
            </NavLink>
          ))}
          <Link className="px-4 py-2.5 text-sm text-brand" to="/dashboard">
            Product intelligence
          </Link>
          <Link className="px-4 py-2.5 text-sm text-brand" to="/operations">
            Operations
          </Link>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
export function AdminOverview() {
  const query = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const results = await Promise.all([
        api.get("/admin/users", { params: { limit: 1 } }),
        ...roles.map((role) =>
          api.get("/admin/users", { params: { role, limit: 1 } }),
        ),
      ]);
      return results.map((r) => r.data.total);
    },
  });
  if (!query.data)
    return (
      <LoadState
        loading={query.isLoading}
        error={query.isError}
        retry={() => query.refetch()}
      />
    );
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">Administration overview</h1>
      <p className="text-sm text-charcoal-500">
        Account access, workspace roles and system activity.
      </p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {["All accounts", ...roles.map((r) => r.replace("_", " "))].map(
          (label, i) => (
            <div key={label} className={panel}>
              <p className="text-sm capitalize">{label}</p>
              <p className="text-3xl font-semibold mt-2">{query.data![i]}</p>
            </div>
          ),
        )}
      </div>
      <div className={panel}>
        <h2 className="font-serif text-xl mb-3">Manage access deliberately</h2>
        <p className="text-sm">
          Staff join through administrator-issued invitations. Public
          registration always creates a customer account. Administrative changes
          are audited.
        </p>
      </div>
    </div>
  );
}
export function AdminUsersPage() {
  const [search, setSearch] = useState(""),
    [role, setRole] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin-users", search, role, status, page],
    queryFn: async () =>
      (
        await api.get<{ items: AccountUser[]; total: number }>("/admin/users", {
          params: {
            search,
            role: role || undefined,
            status: status || undefined,
            page,
            limit: 15,
          },
        })
      ).data,
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">User management</h1>
      <div className={panel + " grid sm:grid-cols-3 gap-4"}>
        <label className="text-sm">
          Search users
          <input
            className={fieldClass + " mt-2"}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Name or email"
          />
        </label>
        <label className="text-sm">
          Filter by role
          <select
            value={role}
            className={fieldClass + " mt-2"}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Filter by status
          <select
            value={status}
            className={fieldClass + " mt-2"}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {!query.data ? (
        <LoadState
          loading={query.isLoading}
          error={query.isError}
          retry={() => query.refetch()}
        />
      ) : (
        <div className={panel}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  {["User", "Email", "Role", "Status", "Action"].map((s) => (
                    <th key={s} className="py-3 px-3">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((u) => (
                  <tr key={u.id} className="border-t border-cream-200">
                    <td className="py-4 px-3">{u.full_name}</td>
                    <td className="py-4 px-3 break-all">{u.email}</td>
                    <td className="py-4 px-3">{u.role}</td>
                    <td className="py-4 px-3">{u.account_status}</td>
                    <td className="py-4 px-3">
                      <Link
                        to={`/admin/users/${u.id}`}
                        className="text-brand underline"
                      >
                        View user
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!query.data.items.length && (
            <p className="py-5 text-sm">No users match these filters.</p>
          )}
          <div className="flex gap-4 mt-4 text-sm">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>
              Page {page} · {query.data.total} accounts
            </span>
            <button
              disabled={page * 15 >= query.data.total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export function AdminUserDetail() {
  const { id } = useParams(),
    current = useAuthStore((s) => s.user)!,
    client = useQueryClient(),
    [role, setRole] = useState(""),
    [status, setStatus] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () =>
      (await api.get<AccountUser>(`/admin/users/${id}`)).data,
  });
  if (!query.data)
    return (
      <LoadState
        loading={query.isLoading}
        error={query.isError}
        retry={() => query.refetch()}
      />
    );
  const user = query.data,
    self = user.id === current.id;
  async function update(kind: "role" | "status", value: string) {
    setError("");
    setMessage("");
    try {
      await api.patch(`/admin/users/${id}/${kind}`, { [kind]: value });
      await query.refetch();
      client.invalidateQueries({ queryKey: ["admin-users"] });
      setMessage(
        `Account ${kind} updated. Existing sessions were revoked when required.`,
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">{user.full_name}</h1>
      <section className={panel + " space-y-3 text-sm"}>
        <p>{user.email}</p>
        <p>
          Role: {user.role} · Status: {user.account_status}
        </p>
        <p>Email verified: {user.email_verified ? "Yes" : "No"}</p>
        <p>Joined: {new Date(user.created_at + "Z").toLocaleDateString()}</p>
        {self && (
          <p className="text-brand">
            Your own role and status must be managed by another authorized
            administrator.
          </p>
        )}
      </section>
      <div className={panel + " space-y-5"}>
        <div>
          <label className="block text-sm mb-2">
            New role
            <select
              aria-label="New role"
              disabled={self}
              value={role || user.role}
              onChange={(e) => setRole(e.target.value)}
              className={fieldClass}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <button
            className={button}
            disabled={self || !role || role === user.role}
            onClick={() => update("role", role)}
          >
            Save role
          </button>
        </div>
        <div>
          <label className="block text-sm mb-2">
            New account status
            <select
              aria-label="New account status"
              disabled={self}
              value={status || user.account_status}
              onChange={(e) => setStatus(e.target.value)}
              className={fieldClass}
            >
              {statuses.map((s) => (
                <option key={s} disabled={s === "pending_verification"}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            className={button}
            disabled={self || !status || status === user.account_status}
            onClick={() => update("status", status)}
          >
            Save account status
          </button>
        </div>
        {message && (
          <p role="status" className="text-sm text-brand">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
      </div>
      <Link to="/admin/users" className="text-brand underline">
        Back to users
      </Link>
    </div>
  );
}
export function InvitationsPage() {
  const [email, setEmail] = useState(""),
    [role, setRole] = useState("product_manager"),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["admin-invitations"],
    queryFn: async () => (await api.get("/admin/invitations")).data,
  });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">Staff invitations</h1>
      <form
        className={panel + " space-y-4"}
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const { data } = await api.post("/admin/invitations", {
              email,
              role,
            });
            setMessage(
              data.delivery_status === "development_outbox"
                ? "Invitation created in the development email outbox. No real email was sent."
                : data.delivery_status === "unavailable"
                  ? "Invitation created, but delivery is unavailable. Configure email and create a replacement invitation."
                  : "Invitation accepted by the configured SMTP service.",
            );
            setEmail("");
            query.refetch();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-sm">
          Staff email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass + " mt-2"}
          />
        </label>
        <label className="block text-sm">
          Staff role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={fieldClass + " mt-2"}
          >
            {roles
              .filter((r) => r !== "customer")
              .map((r) => (
                <option key={r}>{r}</option>
              ))}
          </select>
        </label>
        <p className="text-xs text-charcoal-500">
          Invitations expire after seven days and can be used once.
        </p>
        {message && (
          <p role="status" className="text-sm text-brand">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <button className={button} disabled={busy}>
          {busy ? "Creating…" : "Create staff invitation"}
        </button>
      </form>
      <section className={panel + " space-y-4"}>
        <h2 className="font-serif text-xl">Invitation history</h2>
        {query.data?.items.map((i: any) => (
          <article
            key={i.id}
            className="border-b py-3 text-sm flex flex-wrap gap-3 justify-between"
          >
            <div>
              <p className="font-semibold">{i.email}</p>
              <p>
                {i.role} ·{" "}
                {i.used_at
                  ? "Accepted"
                  : i.revoked_at
                    ? "Revoked"
                    : new Date(i.expires_at + "Z") < new Date()
                      ? "Expired"
                      : "Pending"}
              </p>
              <p className="text-xs text-charcoal-500">
                Expires {new Date(i.expires_at + "Z").toLocaleString()}
              </p>
            </div>
            {!i.used_at && !i.revoked_at && (
              <button
                className="text-brand underline"
                onClick={async () => {
                  try {
                    await api.delete(`/admin/invitations/${i.id}`);
                    query.refetch();
                  } catch (e) {
                    setError(errorMessage(e));
                  }
                }}
              >
                Revoke invitation
              </button>
            )}
          </article>
        ))}
        {query.data?.items.length === 0 && (
          <p className="text-sm">No invitations yet.</p>
        )}
        {query.isError && <p role="alert">Invitations could not be loaded.</p>}
      </section>
    </div>
  );
}
export function AuditPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin-audit", page],
    queryFn: async () =>
      (await api.get("/admin/audit-logs", { params: { page, limit: 25 } }))
        .data,
  });
  if (!query.data)
    return (
      <LoadState
        loading={query.isLoading}
        error={query.isError}
        retry={() => query.refetch()}
      />
    );
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">Security & administration audit</h1>
      <section className={panel + " overflow-x-auto"}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              {["When", "Actor", "Action", "Resource"].map((s) => (
                <th className="px-3 py-3" key={s}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {query.data.items.map((a: any) => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-3 whitespace-nowrap">
                  {new Date(a.timestamp + "Z").toLocaleString()}
                </td>
                <td className="px-3 py-3">{a.actor_user_id ?? "System"}</td>
                <td className="px-3 py-3">{a.action}</td>
                <td className="px-3 py-3">
                  {a.resource_type} {a.resource_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-4 mt-5">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>{page}</span>
          <button
            disabled={page * 25 >= query.data.total}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
export function SystemSettingsPage() {
  const [notice, setNotice] = useState<string | null>(null),
    [enabled, setEnabled] = useState<boolean | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await api.get("/admin/settings")).data,
  });
  if (!query.data)
    return (
      <LoadState
        loading={query.isLoading}
        error={query.isError}
        retry={() => query.refetch()}
      />
    );
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">System settings</h1>
      <form
        className={panel + " space-y-5"}
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          try {
            await api.patch("/admin/settings", {
              registration_enabled: enabled ?? query.data.registration_enabled,
              maintenance_notice: notice ?? query.data.maintenance_notice,
            });
            query.refetch();
            setMessage("System settings saved.");
          } catch (e) {
            setError(errorMessage(e));
          }
        }}
      >
        <label className="flex gap-2 items-center text-sm">
          <input
            type="checkbox"
            checked={enabled ?? query.data.registration_enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />{" "}
          Allow customer registration
        </label>
        <label className="block text-sm">
          Public maintenance notice
          <textarea
            value={notice ?? query.data.maintenance_notice}
            onChange={(e) => setNotice(e.target.value)}
            maxLength={300}
            className={fieldClass + " mt-2"}
          />
        </label>
        {message && (
          <p role="status" className="text-brand text-sm">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-red-800 text-sm">
            {error}
          </p>
        )}
        <button className={button}>Save system settings</button>
      </form>
    </div>
  );
}
