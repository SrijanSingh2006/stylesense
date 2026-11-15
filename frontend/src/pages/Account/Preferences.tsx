import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuthStore, safeDestination } from "../../auth/state";
import { useUserStore } from "../../store/useUserStore";
import { errorMessage } from "../../services/errors";
import { fieldClass } from "../Auth/AuthPages";
import { panel, button, LoadState, type Preferences } from "./shared";
const DEFAULT: Preferences = {
  preferred_categories: [],
  preferred_brands: [],
  preferred_colours: [],
  budget_min: 0,
  budget_max: 5000,
  preferred_fit: "Regular",
  onboarding_completed: false,
};
const CATEGORIES = [
  "Shirts",
  "T-Shirts",
  "Jeans",
  "Trousers",
  "Dresses",
  "Footwear",
  "Jackets",
  "Blazers",
  "Accessories",
];
const COLOURS = [
  "Black",
  "White",
  "Navy",
  "Blue",
  "Olive",
  "Grey",
  "Beige",
  "Brown",
  "Pink",
  "Red",
];
const BRANDS = [
  "UrbanKnit",
  "Aura Denim",
  "VogueCraft",
  "MetroTailor",
  "NordicStyle",
  "TerraSole",
  "Loom & Thread",
  "Artisan Studio",
  "Verona",
  "Solace Active",
];
function Choices({
  title,
  options,
  selected,
  change,
}: {
  title: string;
  options: string[];
  selected: string[];
  change: (values: string[]) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold text-sm mb-3">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((value) => (
          <label
            key={value}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm ${selected.includes(value) ? "bg-brand text-white border-brand" : "bg-white border-cream-300"}`}
          >
            <input
              type="checkbox"
              className="accent-brand mr-2"
              checked={selected.includes(value)}
              onChange={() =>
                change(
                  selected.includes(value)
                    ? selected.filter((v) => v !== value)
                    : [...selected, value],
                )
              }
            />
            {value}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function PreferenceFields({
  draft,
  setDraft,
  step,
}: {
  draft: Preferences;
  setDraft: (p: Preferences) => void;
  step?: number;
}) {
  return (
    <div className="space-y-7">
      {(step === undefined || step === 1) && (
        <Choices
          title="Preferred categories"
          options={CATEGORIES}
          selected={draft.preferred_categories}
          change={(v) => setDraft({ ...draft, preferred_categories: v })}
        />
      )}
      {(step === undefined || step === 2) && (
        <Choices
          title="Preferred colours"
          options={COLOURS}
          selected={draft.preferred_colours}
          change={(v) => setDraft({ ...draft, preferred_colours: v })}
        />
      )}
      {(step === undefined || step === 3) && (
        <Choices
          title="Preferred brands"
          options={BRANDS}
          selected={draft.preferred_brands}
          change={(v) => setDraft({ ...draft, preferred_brands: v })}
        />
      )}
      {(step === undefined || step === 4) && (
        <fieldset className="grid sm:grid-cols-2 gap-4">
          <legend className="font-semibold text-sm mb-3">
            Your shopping budget
          </legend>
          <div>
            <label htmlFor="budget-min" className="text-sm block mb-2">
              Minimum budget (₹)
            </label>
            <input
              id="budget-min"
              type="number"
              min={0}
              max={10000000}
              value={draft.budget_min}
              onChange={(e) =>
                setDraft({ ...draft, budget_min: Number(e.target.value) })
              }
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="budget-max" className="text-sm block mb-2">
              Maximum budget (₹)
            </label>
            <input
              id="budget-max"
              type="number"
              min={draft.budget_min}
              max={10000000}
              value={draft.budget_max}
              onChange={(e) =>
                setDraft({ ...draft, budget_max: Number(e.target.value) })
              }
              className={fieldClass}
            />
          </div>
        </fieldset>
      )}
      {(step === undefined || step === 5) && (
        <label className="block text-sm font-semibold">
          Preferred fit
          <select
            value={draft.preferred_fit}
            onChange={(e) =>
              setDraft({ ...draft, preferred_fit: e.target.value })
            }
            className={fieldClass + " mt-3"}
          >
            {["Slim", "Regular", "Relaxed", "Oversized"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
export function PreferencesPage({
  onboarding = false,
}: {
  onboarding?: boolean;
}) {
  const user = useAuthStore((s) => s.user)!,
    navigate = useNavigate(),
    location = useLocation();
  const [draft, setDraft] = useState(DEFAULT),
    [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["preferences", user.id],
    queryFn: async () =>
      (await api.get<Preferences>("/users/me/preferences")).data,
  });
  useEffect(() => {
    if (query.data) setDraft(query.data);
  }, [query.data]);
  if (!query.data)
    return (
      <LoadState
        loading={query.isLoading}
        error={query.isError}
        retry={() => query.refetch()}
      />
    );
  async function save() {
    setBusy(true);
    setError("");
    try {
      await api.patch("/users/me/preferences", {
        ...draft,
        onboarding_completed: true,
      });
      const { data } = await api.get("/auth/me");
      useAuthStore.getState().updateUser(data);
      useUserStore
        .getState()
        .setCurrentUser({ ...useUserStore.getState().currentUser, ...draft });
      setMessage(
        "Preferences saved. Your recommendations will use these choices.",
      );
      if (onboarding)
        navigate(safeDestination(location.state?.from) || "/account", {
          replace: true,
        });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const titles = [
    "Welcome to your StyleSense",
    "Choose your categories",
    "Pick your palette",
    "Discover your labels",
    "Set your budget",
    "Find your preferred fit",
    "You are ready to discover",
  ];
  const invalidBudget =
    draft.budget_min < 0 || draft.budget_max < draft.budget_min;
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <p className="text-xs uppercase text-brand tracking-widest">
          {onboarding ? `Step ${step + 1} of 7` : "Your StyleSense"}
        </p>
        <h1 className="font-serif text-3xl mt-2">
          {onboarding ? titles[step] : "Shopping preferences"}
        </h1>
        <p className="text-sm text-charcoal-500 mt-2">
          Every choice is optional. You can edit these preferences later.
        </p>
      </header>
      {onboarding && (
        <div className="flex gap-2">
          {titles.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded ${i <= step ? "bg-brand" : "bg-cream-300"}`}
            />
          ))}
        </div>
      )}
      <section className={panel + " space-y-7"}>
        {onboarding && step === 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-serif">
              Hello, {user.full_name.split(" ")[0]}.
            </h2>
            <p className="text-sm">
              Tell us a little about what you like. We will use your saved
              choices to shape product discovery.
            </p>
          </div>
        )}
        {(!onboarding || (step > 0 && step < 6)) && (
          <PreferenceFields
            draft={draft}
            setDraft={setDraft}
            step={onboarding ? step : undefined}
          />
        )}
        {onboarding && step === 6 && (
          <div className="text-sm space-y-3">
            <p>
              Categories:{" "}
              {draft.preferred_categories.join(", ") || "Open to discovery"}
            </p>
            <p>
              Colours: {draft.preferred_colours.join(", ") || "Any palette"}
            </p>
            <p>
              Brands:{" "}
              {draft.preferred_brands.join(", ") || "Explore all labels"}
            </p>
            <p>
              Budget: ₹{draft.budget_min}–₹{draft.budget_max} ·{" "}
              {draft.preferred_fit} fit
            </p>
          </div>
        )}
        {invalidBudget && (
          <p role="alert" className="text-sm text-red-800">
            Maximum budget must be at least the minimum.
          </p>
        )}
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
        <div className="flex flex-wrap gap-4 items-center">
          {onboarding && step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm underline"
            >
              Back
            </button>
          )}
          {!onboarding || step === 6 ? (
            <button
              className={button}
              disabled={busy || invalidBudget}
              onClick={save}
            >
              {busy
                ? "Saving…"
                : onboarding
                  ? "Finish onboarding"
                  : "Save preferences"}
            </button>
          ) : (
            <button
              className={button}
              disabled={invalidBudget}
              onClick={() => setStep(step + 1)}
            >
              Continue
            </button>
          )}
          {onboarding && step > 0 && step < 6 && (
            <button
              className="text-sm text-brand underline"
              onClick={() => {
                if (step === 4 && invalidBudget)
                  setDraft({ ...draft, budget_min: 0, budget_max: 5000 });
                setStep(step + 1);
              }}
            >
              Skip optional step
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
