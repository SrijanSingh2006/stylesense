import React from "react";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { api, refreshSession } from "../services/api";
import {
  useAuthStore,
  can,
  homeFor,
  safeDestination,
  type AccountUser,
} from "../auth/state";
import { ProtectedRoute } from "../auth/Guards";
import { RegisterPage, LoginPage, strength } from "../pages/Auth/AuthPages";
const user = {
  id: 11,
  customer_id: 44,
  full_name: "Private Customer",
  role: "customer",
  permissions: ["cart.manage"],
  onboarding_completed: true,
} as AccountUser;
const reply = {
  user,
  access_token: "sensitive-access",
  csrf_token: "csrf-test",
  expires_in: 300,
};
function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { config, data, headers: {}, status: 200, statusText: "OK" };
}
function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError(
    "Unauthorized",
    "ERR_BAD_REQUEST",
    config,
    {},
    { ...ok(config, {}), status: 401 },
  );
}
function mount(node: React.ReactNode, path = "/") {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  sessionStorage.clear();
  api.defaults.adapter = async (c) => ok(c, { password_complexity: true });
});
afterEach(cleanup);
describe("Account boundaries", () => {
  it("keeps auth material out of browser storage", () => {
    useAuthStore.getState().accept(reply);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
  it("requires actual permissions", () => {
    expect(can(user, "cart.manage")).toBe(true);
    expect(can(user, "users.manage")).toBe(false);
    expect(can(null, "cart.manage")).toBe(false);
  });
  it.each(["https://evil.test", "//evil.test", "/\\evil.test"])(
    "rejects unsafe redirect %s",
    (path) => expect(safeDestination(path)).toBeNull(),
  );
  it("preserves safe intended destinations and chooses role homes", () => {
    expect(safeDestination("/cart?review=1")).toBe("/cart?review=1");
    expect(homeFor({ ...user, role: "admin" })).toBe("/admin");
    expect(homeFor({ ...user, onboarding_completed: false })).toBe(
      "/onboarding",
    );
  });
  it("redirects anonymous users from private routes", async () => {
    mount(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/private" element={<p>Secret</p>} />
        </Route>
        <Route path="/login" element={<p>Login required</p>} />
      </Routes>,
      "/private",
    );
    await screen.findByText("Login required");
    expect(screen.queryByText("Secret")).toBeNull();
  });
  it("denies authenticated users without permission", async () => {
    useAuthStore.getState().accept(reply);
    mount(
      <Routes>
        <Route element={<ProtectedRoute permission="users.manage" />}>
          <Route path="/admin" element={<p>Admin content</p>} />
        </Route>
        <Route path="/unauthorized" element={<p>Access denied</p>} />
      </Routes>,
      "/admin",
    );
    await screen.findByText("Access denied");
    expect(screen.queryByText("Admin content")).toBeNull();
  });
  it("waits for restoration before rendering private content", () => {
    useAuthStore.setState({ status: "restoring" });
    mount(<ProtectedRoute />);
    expect(screen.getByRole("status").textContent).toContain("Restoring");
  });
});
describe("Token refresh and context isolation", () => {
  it("shares one refresh among simultaneous requests", async () => {
    useAuthStore.getState().accept(reply);
    let refreshes = 0;
    api.defaults.adapter = async (c) => {
      if (c.url === "/auth/refresh") {
        refreshes++;
        return ok(c, reply);
      }
      return ok(c, {});
    };
    await Promise.all([refreshSession(), refreshSession(), refreshSession()]);
    expect(refreshes).toBe(1);
  });
  it("retries once and preserves authentication after a business error", async () => {
    useAuthStore.getState().accept(reply);
    let calls = 0;
    api.defaults.adapter = async (c) => {
      if (c.url === "/auth/refresh") return ok(c, reply);
      if (++calls === 1) throw unauthorized(c);
      throw new AxiosError(
        "Unavailable",
        "ERR_BAD_REQUEST",
        c,
        {},
        { ...ok(c, {}), status: 500 },
      );
    };
    await expect(api.get("/private")).rejects.toBeInstanceOf(AxiosError);
    expect(calls).toBe(2);
    expect(useAuthStore.getState().user?.id).toBe(11);
  });
  it("clears expired auth when refresh fails", async () => {
    useAuthStore.getState().accept(reply);
    api.defaults.adapter = async (c) => {
      throw unauthorized(c);
    };
    await expect(api.get("/private")).rejects.toBeInstanceOf(AxiosError);
    expect(useAuthStore.getState().user).toBeNull();
  });
  it("rejects a late private response after an account change", async () => {
    useAuthStore.getState().accept(reply);
    let release!: () => void;
    const pending = new Promise<void>((r) => {
      release = r;
    });
    api.defaults.adapter = async (c) => {
      await pending;
      return ok(c, { private: "old-account" });
    };
    const result = api.get("/private");
    await new Promise((r) => setTimeout(r, 0));
    useAuthStore.getState().clear();
    release();
    await expect(result).rejects.toMatchObject({ code: "ERR_CANCELED" });
  });
});
describe("Registration and login forms", () => {
  it("requires password quality, confirmation and terms", async () => {
    mount(<RegisterPage />);
    fireEvent.change(screen.getByLabelText("Password", { exact: true }), {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "mismatch" },
    });
    expect(screen.getByText("Passwords do not match.")).toBeDefined();
    expect(
      (
        screen.getByRole("button", {
          name: "Create customer account",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() =>
      expect(
        (
          screen.getByRole("button", {
            name: "Create customer account",
          }) as HTMLButtonElement
        ).disabled,
      ).toBe(false),
    );
  });
  it("offers show/hide password without changing its value", () => {
    mount(<LoginPage />);
    const input = screen.getByLabelText("Password", {
      exact: true,
    }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "private" } });
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input.type).toBe("text");
    expect(input.value).toBe("private");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input.type).toBe("password");
  });
  it("enforces configured password lengths and category count", () => {
    expect(strength("short").valid).toBe(false);
    expect(strength("alllowercasepassword").valid).toBe(false);
    expect(strength("alllowercasepassword", false).valid).toBe(true);
    expect(strength("StrongPassword123!").valid).toBe(true);
    expect(strength("A".repeat(129), false).valid).toBe(false);
  });
});

it("does not replay a request under a different user after refresh", async () => {
  useAuthStore.getState().accept(reply);
  let calls = 0,
    release!: () => void;
  const pending = new Promise<void>((r) => {
    release = r;
  });
  api.defaults.adapter = async (c) => {
    if (c.url === "/auth/refresh") {
      await pending;
      return ok(c, reply);
    }
    calls++;
    throw unauthorized(c);
  };
  const request = api.get("/private");
  await new Promise((r) => setTimeout(r, 0));
  useAuthStore.getState().accept({ ...reply, user: { ...user, id: 22 } });
  release();
  await expect(request).rejects.toBeDefined();
  expect(calls).toBe(1);
  expect(useAuthStore.getState().user?.id).toBe(22);
});

it('shows invalid-login feedback without authenticating', async () => {
  api.defaults.adapter = async (c) => {
    if (c.url === '/auth/login') throw new AxiosError('Rejected', 'ERR_BAD_REQUEST', c, {}, { ...ok(c, { detail: 'Unable to sign in. Check credentials and account verification.' }), status: 401 })
    return ok(c, { password_complexity: true })
  }
  mount(<LoginPage />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'unknown@example.com' } })
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'incorrect' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await screen.findByRole('alert')
  expect(screen.getByRole('alert').textContent).toContain('Unable to sign in')
  expect(useAuthStore.getState().user).toBeNull()
})

it('signs in through the API and redirects to the actual staff role', async () => {
  api.defaults.adapter = async (c) => ok(c, c.url === '/auth/login' ? { ...reply, user: { ...user, role: 'product_manager' } } : { password_complexity: true })
  mount(<Routes><Route path="/login" element={<LoginPage />} /><Route path="/dashboard" element={<p>Actual staff workspace</p>} /></Routes>, '/login')
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'manager@example.com' } })
  fireEvent.change(screen.getByLabelText('Password', { exact: true }), { target: { value: 'StrongPassword123!' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await screen.findByText('Actual staff workspace')
  expect(useAuthStore.getState().user?.role).toBe('product_manager')
})
