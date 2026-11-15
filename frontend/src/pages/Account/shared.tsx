import React from "react";
export const panel =
  "rounded-2xl border border-cream-300 bg-white p-5 sm:p-7 shadow-sm";
export const button =
  "rounded-xl bg-brand text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50";
export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}
export function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  if (loading)
    return (
      <p role="status" className="p-8">
        Loading your account…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="p-8 text-red-800">
        Account data could not be loaded.{" "}
        <button className="underline" onClick={retry}>
          Retry
        </button>
      </div>
    );
  return null;
}
export interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  payment_method: string;
  address: Record<string, any> | null;
  items: Array<{
    product_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    selected_size: string;
  }>;
}
export interface Preferences {
  preferred_categories: string[];
  preferred_brands: string[];
  preferred_colours: string[];
  budget_min: number;
  budget_max: number;
  preferred_fit: string;
  onboarding_completed: boolean;
}
export interface Address {
  id: number;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: string;
  is_default: boolean;
}
