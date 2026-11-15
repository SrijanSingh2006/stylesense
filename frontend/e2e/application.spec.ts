import { login, authenticate, saveAddress, paymentStep } from './helpers'
import { test, expect } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const api = 'http://127.0.0.1:8000/api/v1'
const screenshotDir = resolve('../qa/screenshots')
mkdirSync(screenshotDir, { recursive: true })
const routes = ['/', '/discover', '/search?q=shirts', '/product/101', '/cart', '/wishlist', '/account', '/account/profile', '/account/orders', '/account/addresses', '/account/preferences', '/account/security', '/account/notifications', '/admin', '/admin/users', '/admin/invitations', '/admin/audit-logs', '/admin/settings', '/dashboard', '/dashboard/analytics', '/dashboard/experiments', '/dashboard/segments', '/operations', '/operations/inventory', '/operations/returns', '/operations/catalogue', '/operations/pricing', '/operations/roadmap', '/operations/releases', '/operations/feedback', '/operations/settings']
const viewports = [{ width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 360, height: 800 }]

test.beforeEach(async ({ page }) => {
  // Force remote catalogue assets offline to verify the application's local image fallback.
  await page.route('https://images.unsplash.com/**', (route) => route.abort())
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort())
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort())
})

for (const viewport of viewports) {
  test(`all routes, local image fallbacks and layout at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(180000)
    await page.setViewportSize(viewport)
    await login(page, 'admin')
    const errors: string[] = [], failedApi: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('response', (r) => { if (r.url().startsWith(api) && r.status() >= 400) failedApi.push(`${r.status()} ${r.url()}`) })
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading').first()).toBeVisible()
      await page.waitForTimeout(250)
      await expect(page.getByText('Page Not Found', { exact: true })).toHaveCount(0)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true)
      const broken = await page.locator('img').evaluateAll((imgs) => imgs.filter((img) => img.complete && img.naturalWidth === 0).map((i) => i.src))
      expect(broken).toEqual([])
      await page.screenshot({ path: `${screenshotDir}/${viewport.width}-${route.replace(/[^a-z0-9]/gi, '_') || 'home'}.png`, fullPage: true, animations: 'disabled', timeout: 15000 })
    }
    expect(errors).toEqual([])
    expect(failedApi).toEqual([])
  })
}

test('customer search, size, wishlist reload, checkout and inventory', async ({ page, request }) => {
  await login(page)
  await saveAddress(page)
  const before = (await (await request.get(`${api}/products/101`)).json()).stock_quantity
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Search products' }).fill('shirts under 5000')
  await page.getByRole('textbox', { name: 'Search products' }).press('Enter')
  await expect(page).toHaveURL(/\/search/)
  await expect(page.locator('a[href="/product/101"]').first()).toBeVisible()
  await page.goto('/discover')
  await page.getByRole('button', { name: 'Shirts', exact: true }).click()
  await expect(page.locator('h3').first()).toBeVisible()
  await page.goto('/product/101')
  await page.getByRole('button', { name: /Size Assistant|Find My Size|Fit Assistant/i }).first().click()
  await page.getByRole('button', { name: /Calculate|Recommend/i }).click()
  await expect(page.getByText(/Recommended Size/i).first()).toBeVisible()
  await page.getByRole('button', { name: /Select Size/i }).click()
  await page.getByRole('button', { name: 'Add to wishlist' }).first().click()
  await expect(page.getByRole('button', { name: 'Remove from wishlist' }).first()).toBeVisible()
  await page.goto('/wishlist')
  await expect(page.locator('a[href="/product/101"]').first()).toBeVisible()
  await page.reload()
  await expect(page.locator('a[href="/product/101"]').first()).toBeVisible()
  const savedBag = page.waitForResponse((r) => r.url().endsWith('/users/me/cart/items') && r.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Add to bag' }).first().click()
  expect((await savedBag).ok()).toBe(true)
  await page.goto('/cart')
  await paymentStep(page)
  await page.getByRole('button', { name: /Complete Order/ }).click()
  await expect(page.getByText('Order Successfully Placed')).toBeVisible()
  const after = (await (await request.get(`${api}/products/101`)).json()).stock_quantity
  expect(after).toBe(before - 1)
  await page.screenshot({ path: `${screenshotDir}/customer-order-confirmation.png`, fullPage: true, animations: 'disabled', timeout: 15000 })
})

test('failed checkout never confirms an order and preserves cart and input', async ({ page }) => {
  await login(page)
  await saveAddress(page)
  await page.goto('/product/101')
  await page.getByRole('button', { name: 'Add to Shopping Bag' }).click()
  await expect(page.getByText('Added to your shopping bag')).toBeVisible()
  await page.goto('/cart')
  await paymentStep(page)
  await page.getByLabel('Cash on delivery demonstration').check()
  await page.route('**/api/v1/users/me/checkout', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ detail: 'Test checkout unavailable' }) }))
  await page.getByRole('button', { name: /Complete Order/ }).click()
  await expect(page.getByText('Test checkout unavailable').first()).toBeVisible()
  await expect(page.getByText('Order Successfully Placed')).toHaveCount(0)
  await expect(page.getByLabel('Cash on delivery demonstration')).toBeChecked()
  await expect(page.getByRole('button', { name: /Complete Order/ })).toBeEnabled()
})

test('product manager creates experiment, observes users, toggles flag and creates roadmap task', async ({ page, request }) => {
  await login(page, 'product_manager')
  const headers = await authenticate(request, 'product_manager')
  await page.goto('/dashboard/analytics')
  await expect(page.getByText('Conversion Funnel & Cohort Retention')).toBeVisible()
  await page.goto('/dashboard/experiments')
  await page.getByRole('button', { name: /New Experiment|Create Experiment/i }).first().click()
  await page.getByLabel(/Experiment Name/i).fill(`Browser experiment ${Date.now()}`)
  await page.getByLabel(/Hypothesis/i).fill('Relevant products improve completed purchases')
  await page.getByRole('button', { name: /Create Experiment|Launch Experiment/i }).last().click()
  const experiments = await (await request.get(`${api}/experiments`, { headers })).json()
  const id = experiments[0].id
  await page.getByRole('button', { name: 'Start', exact: true }).first().click()
  await page.getByRole('button', { name: 'Assign and record exposure' }).click()
  await expect(page.getByRole('status')).toContainText('exposure for customer 1')
  const assigned = await (await request.post(`${api}/experiments/${id}/assign?customer_id=1`, { headers })).json()
  expect((await request.post(`${api}/events`, { headers, data: { customer_id: 1, session_id: 'browser-experiment', experiment_id: id, variant: assigned.variant, event_type: 'experiment_exposure' } })).ok()).toBe(true)
  const results = await (await request.get(`${api}/experiments/${id}/results`, { headers })).json()
  expect(results.control.exposed_users + results.treatment.exposed_users).toBe(1)
  await page.goto('/operations/settings')
  await page.locator('button').filter({ has: page.locator('svg.lucide-toggle-right') }).first().click()
  await expect(page.getByText(/Feature.*Disabled/)).toBeVisible()
  await page.goto('/operations/roadmap')
  await page.getByRole('button', { name: /New Roadmap Initiative/i }).first().click()
  await page.getByLabel(/Initiative Title/i).fill(`Browser roadmap ${Date.now()}`)
  await page.getByLabel('Reach (Users / Qtr)').fill('10000')
  await page.getByLabel('Impact (0.25 to 3.0)').fill('3')
  await page.getByLabel('Confidence (50 - 100%)').fill('80')
  await page.getByLabel('Effort (Person-Weeks)').fill('4')
  await expect(page.getByText('6000', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Save to Backlog/i }).last().click()
  await expect(page.getByText(/Browser roadmap/).first()).toBeVisible()
  await page.goto('/operations/feedback')
  page.once('dialog', (dialog) => dialog.accept())
  const update = page.waitForResponse((r) => r.url().includes('/feedback/') && r.request().method() === 'PATCH')
  await page.getByRole('button', { name: 'Convert to Roadmap Task' }).first().click()
  expect((await update).ok()).toBe(true)
  await expect(page.getByText('Converted to Roadmap').first()).toBeVisible()
  await page.goto('/operations/inventory')
  await expect(page.getByRole('heading', { name: 'Access not permitted' })).toBeVisible()
})

test('operations stock movement, catalogue resolution, pricing and release gate', async ({ page, request }) => {
  await login(page, 'operations_manager')
  const headers = await authenticate(request, 'operations_manager')
  await page.goto('/operations/inventory')
  await expect(page.locator('h1')).toBeVisible()
  const alerts = await (await request.get(`${api}/inventory/alerts`, { headers })).json()
  const target = alerts[0]
  const before = target.current_stock
  await page.getByRole('button', { name: 'Replenish', exact: true }).first().click()
  await page.getByLabel('Replenishment Quantity (Units)').fill('3')
  await page.getByRole('button', { name: 'Commit Stock Inbound' }).click()
  await expect(page.getByRole('button', { name: 'Commit Stock Inbound' })).toHaveCount(0)
  expect((await (await request.get(`${api}/products/${target.product_id}`)).json()).stock_quantity).toBe(before + 3)
  await page.goto('/operations/returns')
  await expect(page.locator('h1')).toBeVisible()
  await page.goto('/operations/catalogue')
  const resolveButton = page.getByRole('button', { name: /Resolve|Mark.*Fixed/i }).first()
  if (await resolveButton.count()) await resolveButton.click()
  await page.goto('/operations/pricing')
  await page.getByRole('slider', { name: 'Discount percentage' }).press('ArrowRight')
  await expect(page.getByText('Simulation Outcome')).toBeVisible()
  await expect(page.getByText(/Scenario|Projected/i).first()).toBeVisible()
  await page.goto('/operations/releases')
  await expect(page.locator('h1')).toBeVisible()
  const releases = await (await request.get(`${api}/releases`, { headers })).json()
  expect((await request.patch(`${api}/releases/${releases[0].id}`, { headers, data: { status: 'READY_FOR_DEPLOY', checklist: { qa_testing_passed: false } } })).status()).toBe(400)
  await page.reload()
  while (true) {
    await expect(page.locator('button[aria-pressed]').first()).toBeVisible()
    if (!await page.locator('button[aria-pressed="false"]').count()) break
    const changed = page.waitForResponse((r) => r.url().includes('/releases/') && r.request().method() === 'PATCH')
    await page.locator('button[aria-pressed="false"]').first().click()
    expect((await changed).ok()).toBe(true)
    await page.waitForTimeout(150)
  }
  await page.getByRole('button', { name: 'Approve Ready for Production Deploy' }).first().click()
  await expect(page.getByText(/approved for deployment/)).toBeVisible()
})



test('console smoke across every route', async ({ page }) => {
  test.setTimeout(180000)
  await login(page, 'admin')
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (message) => {
    // Remote images/fonts are deliberately aborted in beforeEach; those diagnostics are expected.
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource: net::ERR_FAILED')) errors.push(message.text())
  })
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading').first()).toBeVisible()
    await page.waitForTimeout(150)
  }
  expect(errors).toEqual([])
})


test('unknown route shows a usable 404 and redirect resolves', async ({ page }) => {
  await page.goto('/not-a-real-page')
  await expect(page.getByText('Page Not Found')).toBeVisible()
  await page.getByRole('link', { name: 'Return to Storefront' }).click()
  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await login(page, 'operations_manager')
  await page.goto('/operations')
  await expect(page).toHaveURL(/operations\/inventory$/)
})
