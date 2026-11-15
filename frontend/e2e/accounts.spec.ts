import { test, expect } from "@playwright/test";
import {
  login,
  outboxLink,
  saveAddress,
  paymentStep,
  api,
  origin,
  authenticate,
} from "./helpers";
const password = () => process.env.STYLESENSE_E2E_PASSWORD!;

test("register, verify through private outbox, onboard, persist account and checkout", async ({
  page,
}) => {
  test.setTimeout(120000);
  const email = `journey-${Date.now()}@example.com`;
  await page.goto("/product/101");
  await page.getByRole("button", { name: "Add to Shopping Bag" }).click();
  await expect(page.getByText("Added to your shopping bag")).toBeVisible();
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("Journey Customer");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password());
  await page.getByLabel("Confirm password").fill(password());
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create customer account" }).click();
  await expect(page).toHaveURL(/verify-email/);
  await expect(page.getByText(/no real email has been sent/)).toBeVisible();
  await page.goto(outboxLink(email, "verify-email"));
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your email is verified" }),
  ).toBeVisible();
  await login(page, "customer", email);
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Your Shopping Bag", exact: true }),
  ).toBeVisible();
  await saveAddress(page);
  await page.goto("/account/profile");
  await page
    .getByLabel("Profile image", { exact: false })
    .setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4ZkAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(page.getByRole("img", { name: "Your profile" })).toBeVisible();
  await page.getByLabel("Full name", { exact: true }).fill("Journey Updated");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
  await page.goto("/account/preferences");
  await page.getByRole("checkbox", { name: "Shirts", exact: true }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText(/Preferences saved/)).toBeVisible();
  await page.goto("/product/101");
  await page.getByRole("button", { name: "Add to wishlist" }).first().click();
  await expect(
    page.getByRole("button", { name: "Remove from wishlist" }).first(),
  ).toBeVisible();
  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login(page, "customer", email);
  await page.goto("/account/profile");
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
    "Journey Updated",
  );
  await page.goto("/account/preferences");
  await expect(
    page.getByRole("checkbox", { name: "Shirts", exact: true }),
  ).toBeChecked();
  await page.goto("/wishlist");
  await expect(page.locator('a[href="/product/101"]').first()).toBeVisible();
  await page.goto("/cart");
  await paymentStep(page);
  await page.getByRole("button", { name: /Complete Order/ }).click();
  await expect(page.getByText("Order Successfully Placed")).toBeVisible();
  await page.getByRole("link", { name: "View order details" }).click();
  await expect(page.getByText("Delivery address at purchase")).toBeVisible();
  await expect(
    page.getByText("42 Example Street", { exact: false }),
  ).toBeVisible();
  await page.goto("/account/notifications");
  await expect(
    page.getByRole("heading", { name: /Order confirmed/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(
    page.getByRole("button", { name: "Mark all as read" }),
  ).toBeDisabled();
  const stored = await page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }),
  );
  expect(stored).not.toMatch(
    /access_token|refresh_token|csrf_token|sensitive-access/,
  );
});

test("admin invites a staff member, accepts invitation and enforces their workspace", async ({
  page,
}) => {
  const email = `staff-${Date.now()}@example.com`;
  await login(page, "admin");
  await page.goto("/admin/invitations");
  await page.getByLabel("Staff email").fill(email);
  await page.getByLabel("Staff role").selectOption("product_manager");
  await page.getByRole("button", { name: "Create staff invitation" }).click();
  await expect(
    page.getByText(/Invitation created in the development email outbox/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto(outboxLink(email, "accept-invitation"));
  await page.getByLabel("Full name", { exact: true }).fill("Invited Manager");
  await page.getByLabel("Password", { exact: true }).fill(password());
  await page.getByLabel("Confirm password").fill(password());
  await page.getByRole("button", { name: "Activate staff account" }).click();
  await expect(page).toHaveURL(/login/);
  await login(page, "product_manager", email);
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/operations/inventory");
  await expect(
    page.getByRole("heading", { name: "Access not permitted" }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Access not permitted" }),
  ).toBeVisible();
});

test("password reset invalidates sessions and the single-use link", async ({
  page,
  request,
}) => {
  const email = `reset-${Date.now()}@example.com`;
  const registration = await request.post(`${api}/auth/register`, {
    headers: { Origin: origin },
    data: {
      full_name: "Reset Customer",
      email,
      password: password(),
      confirm_password: password(),
      terms_accepted: true,
    },
  });
  expect(registration.status()).toBe(201);
  await page.goto(outboxLink(email, "verify-email"));
  await page.getByRole("button", { name: "Verify email", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your email is verified" }),
  ).toBeVisible();
  await login(page, "customer", email);
  await page.goto("/account/security");
  await expect(page.getByText("This session", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Request reset instructions" })
    .click();
  await expect(page.getByText(/no real email is sent/)).toBeVisible();
  const link = outboxLink(email, "reset-password");
  const next = password() + "Next2!";
  await page.goto(link);
  await page.getByLabel("Password", { exact: true }).fill(next);
  await page.getByLabel("Confirm password").fill(next);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page).toHaveURL(/login/);
  await login(page, "customer", email, next);
  await page.goto("/account/security");
  await page.getByRole("button", { name: "Sign out everywhere" }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto(link);
  await page.getByLabel("Password", { exact: true }).fill(next);
  await page.getByLabel("Confirm password").fill(next);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "invalid, expired or already used",
  );
});

test("customer denied private management APIs and staff role escalations", async ({
  page,
  request,
}) => {
  const headers = await authenticate(request, "customer");
  for (const endpoint of [
    "/analytics/overview",
    "/inventory",
    "/admin/users",
    "/admin/audit-logs",
  ])
    expect((await request.get(api + endpoint, { headers })).status()).toBe(403);
  await login(page);
  await page.goto("/admin/users");
  await expect(
    page.getByRole("heading", { name: "Access not permitted" }),
  ).toBeVisible();
});

for (const width of [1440, 768, 390, 360])
  test(`public auth forms fit viewport ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/login",
      "/register",
      "/forgot-password",
      "/verify-email",
      "/reset-password",
      "/accept-invitation",
      "/terms",
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading").first()).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 2,
          ),
        )
        .toBe(true);
      await page.screenshot({
        path: `../qa/screenshots/auth-${width}-${route.slice(1)}.png`,
        fullPage: true,
      });
    }
  });

test("admin searches users, changes status and inspects the audit trail", async ({
  page,
  request,
}) => {
  const customerHeaders = await authenticate(request, "customer");
  await login(page, "admin");
  await page.goto("/admin/users");
  await page.getByLabel("Search users").fill("customer@stylesense.example.com");
  await page.getByRole("link", { name: "View user" }).click();
  await page.getByLabel("New account status").selectOption("suspended");
  await page.getByRole("button", { name: "Save account status" }).click();
  await expect(
    page.getByText("Account status updated.", { exact: false }),
  ).toBeVisible();
  expect(
    (
      await request.get(`${api}/users/me`, { headers: customerHeaders })
    ).status(),
  ).toBe(401);
  await page.getByLabel("New account status").selectOption("active");
  await page.getByRole("button", { name: "Save account status" }).click();
  await expect(page.getByText("Role: customer · Status: active")).toBeVisible();
  await page.goto("/admin/audit-logs");
  await expect(
    page
      .getByRole("cell", { name: "admin.status_changed", exact: true })
      .first(),
  ).toBeVisible();
  await page.screenshot({
    path: "../qa/screenshots/admin-audit-journey.png",
    fullPage: true,
  });
});

test("anonymous visitors are redirected and direct private requests return no records", async ({
  page,
  request,
}) => {
  for (const path of ["/account/orders", "/dashboard", "/admin/users"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  }
  for (const endpoint of [
    "/users/me/orders",
    "/analytics/overview",
    "/admin/users",
  ]) {
    const response = await request.get(api + endpoint);
    expect(response.status()).toBe(401);
    expect(await response.json()).not.toHaveProperty("items");
  }
});
