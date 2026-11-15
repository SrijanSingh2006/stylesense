import { expect, type Page, type APIRequestContext } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
export const api = "http://127.0.0.1:8000/api/v1";
export const origin = "http://127.0.0.1:5173";
export async function login(
  page: Page,
  role = "customer",
  email = `${role}@stylesense.example.com`,
  password = process.env.STYLESENSE_E2E_PASSWORD!,
) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login$/);
  if (page.url().includes("/onboarding")) {
    for (let i = 0; i < 6; i++)
      await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Finish onboarding" }).click();
    await expect(page).toHaveURL(/\/account$/);
  }
}
export async function authenticate(request: APIRequestContext, role: string) {
  const response = await request.post(`${api}/auth/login`, {
    headers: { Origin: origin },
    data: {
      email: `${role}@stylesense.example.com`,
      password: process.env.STYLESENSE_E2E_PASSWORD,
    },
  });
  expect(response.ok()).toBe(true);
  const data = await response.json();
  return { Authorization: `Bearer ${data.access_token}`, Origin: origin };
}
export async function saveAddress(page: Page) {
  await page.goto("/account/addresses");
  await page.getByLabel("Recipient name").fill("Browser Customer");
  await page.getByLabel("Phone", { exact: true }).fill("9876543210");
  await page
    .getByLabel("Address line 1", { exact: true })
    .fill("42 Example Street");
  await page.getByLabel("City", { exact: true }).fill("Delhi");
  await page.getByLabel("State", { exact: true }).fill("Delhi");
  await page.getByLabel("Postal code", { exact: true }).fill("110001");
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit address" }).first(),
  ).toBeVisible();
}
export async function paymentStep(page: Page) {
  await page.getByRole("button", { name: "Continue to order review" }).click();
  await page
    .getByRole("button", { name: "Continue to payment method" })
    .click();
}
export function outboxLink(email: string, route: string) {
  const dir = join(process.env.STYLESENSE_E2E_DIR!, "outbox");
  const messages = readdirSync(dir)
    .map((f) => ({
      ...JSON.parse(readFileSync(join(dir, f), "utf8")),
      modified: statSync(join(dir, f)).mtimeMs,
    }))
    .filter((m) => m.to === email && m.body.includes(`/${route}#token=`))
    .sort((a, b) => b.modified - a.modified);
  if (!messages.length)
    throw new Error(`No local ${route} message for test account`);
  return messages[0].body.match(/https?:[^\s]+/)![0];
}
