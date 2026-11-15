import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore, can, homeFor } from "../../auth/state";
import { api, fetchRecommendations, mediaUrl } from "../../services/api";
import { errorMessage } from "../../services/errors";
import { ProductCard } from "../../components/ui/ProductCard";
import { fieldClass } from "../Auth/AuthPages";
import { panel, button, formatMoney, LoadState, type Order } from "./shared";

export function AccountOverview() {
  const user = useAuthStore((s) => s.user)!;
  const orders = useQuery({
    queryKey: ["orders", user.id],
    queryFn: async () =>
      (await api.get<{ items: Order[]; total: number }>("/users/me/orders"))
        .data,
    enabled: can(user, "orders.read_own"),
  });
  const wishlist = useQuery({
    queryKey: ["wishlist", user.id],
    queryFn: async () => (await api.get("/users/me/wishlist")).data,
    enabled: can(user, "wishlist.manage"),
  });
  const recommendations = useQuery({
    queryKey: ["account-recommendations", user.id],
    queryFn: () => fetchRecommendations(user.customer_id || 0, 4),
    enabled: user.role === "customer",
  });
  const activity = useQuery({
    queryKey: ["my-activity", user.id],
    queryFn: async () => (await api.get("/users/me/activity")).data,
  });
  const completion = Math.round(
    ([
      !!user.full_name,
      !!user.phone,
      user.email_verified,
      user.onboarding_completed,
    ].filter(Boolean).length /
      4) *
      100,
  );
  return (
    <div className="space-y-7">
      <header>
        <p className="text-xs uppercase tracking-widest text-brand">
          Your StyleSense
        </p>
        <h1 className="font-serif text-3xl mt-2">
          Welcome, {user.full_name.split(" ")[0]}
        </h1>
        <p className="text-sm text-charcoal-500 mt-2">
          Your collection, account and recent activity in one place.
        </p>
      </header>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className={panel}>
          <p className="text-sm">Account completion</p>
          <strong className="text-3xl">{completion}%</strong>
        </div>
        <div className={panel}>
          <p className="text-sm">Orders</p>
          <strong className="text-3xl">{orders.data?.total ?? 0}</strong>
        </div>
        <div className={panel}>
          <p className="text-sm">Saved favourites</p>
          <strong className="text-3xl">{wishlist.data?.length ?? 0}</strong>
        </div>
      </div>
      {user.role === "customer" && !user.onboarding_completed && (
        <div className={panel}>
          <h2 className="text-xl font-serif">
            Make discovery feel more like you
          </h2>
          <p className="text-sm my-3">
            Choose your colours, brands and shopping budget.
          </p>
          <Link className={button + " inline-block"} to="/onboarding">
            Complete onboarding
          </Link>
        </div>
      )}
      {user.role !== "customer" && (
        <Link to={homeFor(user)} className={button + " inline-block"}>
          Open your {user.role.replace("_", " ")} workspace
        </Link>
      )}
      {user.role === "customer" && (
        <section className={panel}>
          <h2 className="font-serif text-xl mb-4">Recent orders</h2>
          {orders.isError ? (
            <p role="alert">Orders could not be loaded.</p>
          ) : orders.data?.items.length ? (
            orders.data.items.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                to={`/account/orders/${o.id}`}
                className="flex justify-between gap-3 border-b py-3 text-sm"
              >
                <span>
                  Order #{o.id} · {o.status}
                </span>
                <span>{formatMoney(o.total_amount)}</span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-charcoal-500">
              Your next favourite is waiting.{" "}
              <Link to="/discover" className="text-brand underline">
                Explore the collection
              </Link>
              .
            </p>
          )}
        </section>
      )}
      <section className={panel}>
        <h2 className="font-serif text-xl mb-3">Recent account activity</h2>
        {activity.data?.items?.length ? (
          <ul className="text-sm space-y-2">
            {activity.data.items.slice(0, 5).map((a: any) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span>
                  {a.action.replaceAll(".", " ").replaceAll("_", " ")}
                </span>
                <span className="text-charcoal-500">
                  {new Date(a.timestamp + "Z").toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-charcoal-500">
            Your account activity will appear here.
          </p>
        )}
      </section>
      {recommendations.data && (
        <section>
          <h2 className="font-serif text-xl mb-4">A few discoveries for you</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {recommendations.data.items.map((r) => (
              <ProductCard
                key={r.product.id}
                product={r.product}
                explanation={r.explanation}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
export function ProfilePage() {
  const user = useAuthStore((s) => s.user)!,
    [name, setName] = useState(user.full_name),
    [phone, setPhone] = useState(user.phone || ""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl">Your profile</h1>
      <form
        className={panel + " space-y-5 max-w-2xl"}
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            const { data } = await api.patch("/users/me", {
              full_name: name,
              phone: phone || null,
            });
            useAuthStore.getState().updateUser(data);
            setMessage("Profile saved.");
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img
              src={mediaUrl(user.avatar_url)}
              alt="Your profile"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-2xl"
              aria-label="Profile initials"
            >
              {user.full_name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <p className="text-sm text-charcoal-500">
            Your personal account profile
          </p>
        </div>
        <div>
          <label htmlFor="profile-name" className="block mb-2 text-sm">
            Full name
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={100}
            required
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="profile-phone" className="block mb-2 text-sm">
            Phone
          </label>
          <input
            id="profile-phone"
            value={phone}
            maxLength={25}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <span className="text-sm">Verified email</span>
          <p className="mt-1 text-charcoal-500">{user.email}</p>
        </div>
        <div>
          <label htmlFor="profile-avatar" className="block mb-2 text-sm">
            Profile image (JPG, PNG or WEBP; up to 2 MB)
          </label>
          <input
            id="profile-avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setBusy(true);
              setError("");
              try {
                const form = new FormData();
                form.append("file", file);
                const { data } = await api.post("/users/me/avatar", form, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                useAuthStore.getState().updateUser(data);
                setMessage("Profile image saved.");
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          />
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
        <button className={button} disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
export function OrdersPage() {
  const user = useAuthStore((s) => s.user)!,
    [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["orders", user.id, page],
    queryFn: async () =>
      (
        await api.get<{ items: Order[]; total: number }>("/users/me/orders", {
          params: { page, limit: 10 },
        })
      ).data,
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
    <div className="space-y-5">
      <h1 className="font-serif text-3xl">Your orders</h1>
      <div className={panel}>
        {!query.data.items.length && (
          <p>
            No orders yet.{" "}
            <Link className="text-brand underline" to="/discover">
              Discover products
            </Link>
            .
          </p>
        )}
        {query.data.items.map((o) => (
          <Link
            key={o.id}
            to={`/account/orders/${o.id}`}
            className="flex flex-wrap justify-between gap-4 border-b py-4 text-sm"
          >
            <span className="font-semibold">Order #{o.id}</span>
            <span>{new Date(o.created_at + "Z").toLocaleDateString()}</span>
            <span>{o.status}</span>
            <span>{formatMoney(o.total_amount)}</span>
          </Link>
        ))}
        <div className="flex gap-4 mt-5">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            disabled={page * 10 >= query.data.total}
            onClick={() => setPage(page + 1)}
            className="disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
export function OrderDetailPage() {
  const { id } = useParams(),
    user = useAuthStore((s) => s.user)!,
    client = useQueryClient(),
    [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["order", user.id, id],
    queryFn: async () => (await api.get<Order>(`/users/me/orders/${id}`)).data,
    retry: false,
  });
  if (!query.data)
    return (
      <LoadState
        loading={query.isLoading}
        error={query.isError}
        retry={() => query.refetch()}
      />
    );
  const order = query.data;
  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl">Order #{order.id}</h1>
      <section className={panel + " space-y-4"}>
        <p className="text-sm">
          {order.status} ·{" "}
          {new Date(order.created_at + "Z").toLocaleDateString()} · Simulated
          payment
        </p>
        {order.items.map((i, n) => (
          <div
            key={n}
            className="flex justify-between gap-4 border-b py-3 text-sm"
          >
            <div>
              <Link
                to={`/product/${i.product_id}`}
                className="font-semibold text-brand"
              >
                {i.name}
              </Link>
              <p>
                Size {i.selected_size} · Quantity {i.quantity}
              </p>
            </div>
            <span>{formatMoney(i.unit_price * i.quantity)}</span>
          </div>
        ))}
        <p className="text-lg font-semibold">
          Order total: {formatMoney(order.total_amount)}
        </p>
        {order.address && (
          <div className="text-sm">
            <h2 className="font-semibold">Delivery address at purchase</h2>
            <p>
              {order.address.full_name}
              <br />
              {order.address.address_line_1}, {order.address.address_line_2}
              <br />
              {order.address.city}, {order.address.state}{" "}
              {order.address.postal_code}
            </p>
          </div>
        )}
        {order.status === "PENDING" && (
          <button
            className={button}
            onClick={async () => {
              try {
                await api.post(`/users/me/orders/${order.id}/cancel`);
                await query.refetch();
                client.invalidateQueries({ queryKey: ["orders"] });
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          >
            Cancel pending order
          </button>
        )}
        {error && (
          <p role="alert" className="text-red-800">
            {error}
          </p>
        )}
      </section>
      <Link to="/account/orders" className="text-brand underline">
        Back to orders
      </Link>
    </div>
  );
}
export function NotificationsPage() {
  const user = useAuthStore((s) => s.user)!,
    client = useQueryClient(),
    [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["notifications", user.id, page],
    queryFn: async () =>
      (
        await api.get("/users/me/notifications", {
          params: { page, limit: 20 },
        })
      ).data,
  });
  if (!query.data)
    return (
      <LoadState
        loading={query.isLoading}
        error={query.isError}
        retry={() => query.refetch()}
      />
    );
  const invalidate = () =>
    client.invalidateQueries({ queryKey: ["notifications", user.id] });
  return (
    <div className="space-y-5">
      <header className="flex justify-between gap-4 flex-wrap">
        <h1 className="font-serif text-3xl">Notifications</h1>
        <button
          className={button}
          disabled={!query.data.unread_count}
          onClick={async () => {
            await api.patch("/users/me/notifications/read-all");
            invalidate();
          }}
        >
          Mark all as read
        </button>
      </header>
      <div className={panel}>
        {query.data.items.length ? (
          query.data.items.map((n: any) => (
            <article
              key={n.id}
              className={`border-b py-4 space-y-2 ${n.read_at ? "text-charcoal-500" : "text-charcoal-900"}`}
            >
              <h2 className="font-semibold">{n.title}</h2>
              <p className="text-sm">{n.message}</p>
              {!n.read_at && (
                <button
                  className="text-sm text-brand underline"
                  onClick={async () => {
                    await api.patch(`/users/me/notifications/${n.id}/read`);
                    invalidate();
                  }}
                >
                  Mark as read
                </button>
              )}
            </article>
          ))
        ) : (
          <p>No notifications yet.</p>
        )}
        <div className="flex gap-4 mt-5">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>{page}</span>
          <button
            disabled={page * 20 >= query.data.total}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
