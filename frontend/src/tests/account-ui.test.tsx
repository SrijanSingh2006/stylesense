import React from "react";
import { beforeEach, afterEach, it, expect } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "../services/api";
import { useAuthStore, type AccountUser } from "../auth/state";
import { GuestRoute, UnauthorizedPage } from "../auth/Guards";
import {
  ForgotPasswordPage,
  TokenPasswordPage,
  VerifyEmailPage,
} from "../pages/Auth/AuthPages";
import { PreferencesPage } from "../pages/Account/Preferences";
import {
  ProfilePage,
  OrdersPage,
  NotificationsPage,
} from "../pages/Account/AccountPages";
import { AddressesPage } from "../pages/Account/Addresses";
import { AdminUsersPage } from "../pages/Admin/AdminPages";
import { signOut } from "../services/auth";
const user = {
  id: 1,
  customer_id: 10,
  full_name: "Customer One",
  email: "customer@example.com",
  role: "customer",
  permissions: ["profile.manage"],
  onboarding_completed: true,
} as AccountUser;
const preferences = {
  preferred_categories: [],
  preferred_brands: [],
  preferred_colours: [],
  budget_min: 0,
  budget_max: 5000,
  preferred_fit: "Regular",
  onboarding_completed: false,
};
const ok = (config: any, data: unknown) => ({
  config,
  data,
  headers: {},
  status: 200,
  statusText: "OK",
});
const failed = (config: any) =>
  new AxiosError(
    "Unavailable",
    "ERR_BAD_REQUEST",
    config,
    {},
    { ...ok(config, { detail: "Service unavailable" }), status: 503 },
  );
function mount(node: React.ReactNode, path = "/") {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, gcTime: 0 } },
        })
      }
    >
      <MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  useAuthStore
    .getState()
    .accept({
      user,
      access_token: "test",
      csrf_token: "csrf",
      expires_in: 300,
    });
  api.defaults.adapter = async (c) =>
    ok(c, c.url === "/auth/policy" ? { password_complexity: true } : {});
});
afterEach(cleanup);
it("forgot password reports development delivery without enumerating users", async () => {
  api.defaults.adapter = async (c) =>
    ok(c, {
      message: "If eligible, reset instructions are available.",
      delivery_mode: "outbox",
    });
  mount(<ForgotPasswordPage />);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "unknown@example.com" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Request reset instructions" }),
  );
  await screen.findByText(/no real email is sent/);
  expect(screen.queryByRole("alert")).toBeNull();
});
it("forgot password reports actual server failure", async () => {
  api.defaults.adapter = async (c) => {
    throw failed(c);
  };
  mount(<ForgotPasswordPage />);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Request reset instructions" }),
  );
  await screen.findByRole("alert");
  expect(screen.getByRole("alert").textContent).toContain(
    "Service unavailable",
  );
});
it("reset requires a link and matching strong password", () => {
  mount(<TokenPasswordPage />);
  expect(screen.getByRole("alert").textContent).toContain("valid link");
  expect(
    (
      screen.getByRole("button", {
        name: "Save new password",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
it("verification failure does not claim activation", async () => {
  api.defaults.adapter = async (c) => {
    throw failed(c);
  };
  mount(<VerifyEmailPage />, "/verify-email#token=invalid-token-value-long");
  fireEvent.click(screen.getByRole("button", { name: "Verify email" }));
  await screen.findByRole("alert");
  expect(screen.queryByText("Your email is verified")).toBeNull();
});
it("guest-only routes redirect a manager to their workspace", async () => {
  useAuthStore.getState().updateUser({ ...user, role: "product_manager" });
  mount(
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<p>Login form</p>} />
      </Route>
      <Route path="/dashboard" element={<p>Manager workspace</p>} />
    </Routes>,
    "/login",
  );
  await screen.findByText("Manager workspace");
  expect(screen.queryByText("Login form")).toBeNull();
});
it("unauthorized page links to the account", () => {
  mount(<UnauthorizedPage />);
  expect(
    screen
      .getByRole("link", { name: "Go to your account" })
      .getAttribute("href"),
  ).toBe("/account");
});
it("logout clears memory after server success", async () => {
  await signOut();
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().status).toBe("anonymous");
});
it("failed logout retains the session and surfaces failure", async () => {
  api.defaults.adapter = async (c) => {
    throw failed(c);
  };
  await expect(signOut()).rejects.toBeInstanceOf(AxiosError);
  expect(useAuthStore.getState().user?.id).toBe(1);
});
it("onboarding preserves choices across next, back and optional steps", async () => {
  api.defaults.adapter = async (c) => ok(c, preferences);
  mount(<PreferencesPage onboarding />);
  await screen.findByText("Step 1 of 7");
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByText("Step 2 of 7");
  fireEvent.click(screen.getByRole("checkbox", { name: "Shirts" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(
    (screen.getByRole("checkbox", { name: "Shirts" }) as HTMLInputElement)
      .checked,
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Skip optional step" }));
  await screen.findByText("Step 3 of 7");
});
it("profile persists the server result", async () => {
  let payload: any;
  api.defaults.adapter = async (c) => {
    payload = JSON.parse(c.data);
    return ok(c, { ...user, ...payload });
  };
  mount(<ProfilePage />);
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Updated Customer" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByText("Profile saved.");
  expect(payload.full_name).toBe("Updated Customer");
  expect(useAuthStore.getState().user?.full_name).toBe("Updated Customer");
});
it("address form submits validated owner-independent fields", async () => {
  let payload: any;
  api.defaults.adapter = async (c) => {
    if (c.method === "post") payload = JSON.parse(c.data);
    return ok(c, []);
  };
  mount(<AddressesPage />);
  await screen.findByText("Add your first address for checkout.");
  for (const [label, value] of [
    ["Recipient name", "Customer One"],
    ["Phone", "9999999999"],
    ["Address line 1", "10 Example Street"],
    ["City", "Delhi"],
    ["State", "Delhi"],
    ["Postal code", "110001"],
  ])
    fireEvent.change(screen.getByLabelText(label, { exact: true }), {
      target: { value },
    });
  fireEvent.click(screen.getByLabelText("Make this my default address"));
  fireEvent.click(screen.getByRole("button", { name: "Save address" }));
  await waitFor(() => expect(payload?.is_default).toBe(true));
  expect(payload).not.toHaveProperty("user_id");
});
it("order errors show retry without fabricated empty history", async () => {
  api.defaults.adapter = async (c) => {
    throw failed(c);
  };
  mount(<OrdersPage />);
  await screen.findByRole("button", { name: "Retry" });
  expect(screen.queryByText("No orders yet.")).toBeNull();
});
it("notifications mark the actual record read", async () => {
  let marked = false;
  api.defaults.adapter = async (c) => {
    if (c.method === "patch") marked = true;
    return ok(c, {
      total: 1,
      unread_count: marked ? 0 : 1,
      items: [
        {
          id: 7,
          title: "Order confirmed",
          message: "Simulated order",
          read_at: marked ? "2026-11-15" : null,
        },
      ],
    });
  };
  mount(<NotificationsPage />);
  fireEvent.click(await screen.findByRole("button", { name: "Mark as read" }));
  await waitFor(() => expect(marked).toBe(true));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Mark as read" })).toBeNull(),
  );
});
it("admin search and filters send actual query parameters", async () => {
  const requests: any[] = [];
  api.defaults.adapter = async (c) => {
    requests.push(c.params);
    return ok(c, { total: 1, items: [user] });
  };
  mount(<AdminUsersPage />);
  await screen.findByText("customer@example.com");
  fireEvent.change(screen.getByLabelText("Search users"), {
    target: { value: "Customer" },
  });
  fireEvent.change(screen.getByLabelText("Filter by role"), {
    target: { value: "customer" },
  });
  await waitFor(() =>
    expect(
      requests.some((p) => p.search === "Customer" && p.role === "customer"),
    ).toBe(true),
  );
});

it("recognizes a verification token added to the same page hash", async () => {
  const { Link } = await import("react-router-dom");
  mount(
    <>
      <Link to="/verify-email#token=new-single-use-token">
        Open verification message
      </Link>
      <VerifyEmailPage />
    </>,
    "/verify-email",
  );
  expect(screen.queryByRole("button", { name: "Verify email" })).toBeNull();
  fireEvent.click(
    screen.getByRole("link", { name: "Open verification message" }),
  );
  await screen.findByRole("button", { name: "Verify email" });
});
