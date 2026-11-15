import { useAuthPolicy } from "../../auth/useAuthPolicy";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/state";
import { api } from "../../services/api";
import { signOut } from "../../services/auth";
import { errorMessage } from "../../services/errors";
import { PasswordFields, fieldClass, strength } from "../Auth/AuthPages";
import { panel, button, LoadState } from "./shared";
export function SecurityPage() {
  const user = useAuthStore((s) => s.user)!,
    navigate = useNavigate(),
    [current, setCurrent] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const policy = useAuthPolicy();
  const query = useQuery({
    queryKey: ["sessions", user.id],
    queryFn: async () => (await api.get("/auth/sessions")).data,
  });
  async function revoke(id: string, isCurrent: boolean) {
    setError("");
    try {
      await api.delete(`/auth/sessions/${id}`);
      if (isCurrent) {
        useAuthStore.getState().clear();
        navigate("/login");
      } else query.refetch();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Security & sessions</h1>
      <section className={panel + " space-y-4"}>
        <h2 className="font-serif text-xl">Active sessions</h2>
        {!query.data ? (
          <LoadState
            loading={query.isLoading}
            error={query.isError}
            retry={() => query.refetch()}
          />
        ) : (
          query.data.map((s: any) => (
            <div
              key={s.id}
              className="border-b py-3 flex justify-between gap-4"
            >
              <div className="min-w-0">
                <strong className="text-sm">
                  {s.current ? "This session" : "Another session"}
                </strong>
                <p className="text-xs text-charcoal-500 break-all">
                  {s.user_agent || "Unknown browser"}
                </p>
                <p className="text-xs">
                  Expires {new Date(s.expires_at + "Z").toLocaleString()}
                </p>
              </div>
              <button
                className="text-sm text-brand"
                onClick={() => revoke(s.id, s.current)}
              >
                Revoke {s.current ? "current" : "session"}
              </button>
            </div>
          ))
        )}
        <div className="flex gap-4 flex-wrap">
          <button
            className={button}
            onClick={async () => {
              try {
                for (const s of query.data || [])
                  if (!s.current) await api.delete(`/auth/sessions/${s.id}`);
                query.refetch();
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          >
            Revoke other sessions
          </button>
          <button
            className="text-sm text-brand underline"
            onClick={async () => {
              try {
                await signOut(true);
                navigate("/login");
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          >
            Sign out everywhere
          </button>
        </div>
      </section>
      <form
        className={panel + " space-y-4 max-w-2xl"}
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api.post("/auth/change-password", {
              current_password: current,
              password,
              confirm_password: confirmation,
            });
            useAuthStore.getState().clear();
            navigate("/login", {
              state: {
                message: "Password changed. Sign in again on your devices.",
              },
            });
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-serif text-xl">Change password</h2>
        <div>
          <label htmlFor="current-password" className="block text-sm mb-2">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={fieldClass}
          />
        </div>
        <PasswordFields
          password={password}
          setPassword={setPassword}
          confirmation={confirmation}
          setConfirmation={setConfirmation}
          showStrength
        />
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          className={button}
          disabled={
            busy ||
            !strength(password, policy.data?.password_complexity ?? true)
              .valid ||
            confirmation !== password
          }
        >
          {busy ? "Updating…" : "Change password and sign out"}
        </button>
      </form>
    </div>
  );
}
