import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useAuthStore } from "../../auth/state";
import { errorMessage } from "../../services/errors";
import { fieldClass } from "../Auth/AuthPages";
import { panel, button, LoadState, type Address } from "./shared";
const EMPTY = {
  full_name: "",
  phone: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "IN",
  address_type: "home",
  is_default: false,
};
export function AddressesPage() {
  const user = useAuthStore((s) => s.user)!,
    [draft, setDraft] = useState(EMPTY),
    [editing, setEditing] = useState<number | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["addresses", user.id],
    queryFn: async () => (await api.get<Address[]>("/users/me/addresses")).data,
  });
  if (!query.data)
    return (
      <LoadState
        loading={query.isLoading}
        error={query.isError}
        retry={() => query.refetch()}
      />
    );
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await query.refetch();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl">Saved addresses</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {query.data.map((a) => (
          <article key={a.id} className={panel + " text-sm space-y-3"}>
            <h2 className="font-semibold">
              {a.full_name}{" "}
              {a.is_default && <span className="text-brand">· Default</span>}
            </h2>
            <p>
              {a.address_line_1}
              <br />
              {a.address_line_2}
              <br />
              {a.city}, {a.state} {a.postal_code}
              <br />
              {a.country} · {a.phone}
            </p>
            <div className="flex gap-4 flex-wrap text-brand">
              <button
                onClick={() => {
                  const { id, ...values } = a;
                  setEditing(id);
                  setDraft({
                    ...values,
                    address_line_2: values.address_line_2 || "",
                  });
                }}
              >
                Edit address
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  action(() => api.delete(`/users/me/addresses/${a.id}`))
                }
              >
                Delete address
              </button>
              {!a.is_default && (
                <button
                  disabled={busy}
                  onClick={() =>
                    action(() =>
                      api.patch(`/users/me/addresses/${a.id}`, {
                        is_default: true,
                      }),
                    )
                  }
                >
                  Make default
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!query.data.length && (
        <p className="text-sm text-charcoal-500">
          Add your first address for checkout.
        </p>
      )}
      <form
        className={panel + " space-y-4 max-w-2xl"}
        onSubmit={async (event) => {
          event.preventDefault();
          await action(async () => {
            await (editing
              ? api.patch(`/users/me/addresses/${editing}`, draft)
              : api.post("/users/me/addresses", draft));
            setDraft(EMPTY);
            setEditing(null);
          });
        }}
      >
        <h2 className="font-serif text-xl">
          {editing ? "Edit address" : "Add an address"}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {(
            [
              ["full_name", "Recipient name"],
              ["phone", "Phone"],
              ["address_line_1", "Address line 1"],
              ["address_line_2", "Address line 2"],
              ["city", "City"],
              ["state", "State"],
              ["postal_code", "Postal code"],
              ["country", "Country code"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={"address-" + key} className="block text-sm mb-2">
                {label}
              </label>
              <input
                id={"address-" + key}
                value={draft[key]}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [key]:
                      key === "country"
                        ? e.target.value.toUpperCase()
                        : e.target.value,
                  })
                }
                required={key !== "address_line_2"}
                minLength={
                  key === "postal_code"
                    ? 3
                    : key === "phone"
                      ? 7
                      : key === "address_line_1"
                        ? 3
                        : 2
                }
                maxLength={key === "country" ? 2 : key === "phone" ? 25 : 200}
                className={fieldClass}
              />
            </div>
          ))}
        </div>
        <label className="block text-sm">
          Address type
          <select
            className={fieldClass + " mt-2"}
            value={draft.address_type}
            onChange={(e) =>
              setDraft({ ...draft, address_type: e.target.value })
            }
          >
            {["home", "work", "shipping", "billing"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.is_default}
            onChange={(e) =>
              setDraft({ ...draft, is_default: e.target.checked })
            }
          />{" "}
          Make this my default address
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="flex gap-4">
          <button className={button} disabled={busy}>
            {busy ? "Saving…" : "Save address"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setDraft(EMPTY);
                setEditing(null);
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
