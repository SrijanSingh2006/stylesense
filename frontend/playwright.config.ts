import { defineConfig } from '@playwright/test'
import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const dir = process.env.STYLESENSE_E2E_DIR || mkdtempSync(join(tmpdir(), 'stylesense-browser-'))
process.env.STYLESENSE_E2E_DIR = dir
const python = process.env.STYLESENSE_PYTHON || [resolve('../backend/.venv/bin/python'), resolve('../backend/.venv/Scripts/python.exe'), resolve('../../stylesense-venv/bin/python')].find(existsSync) || 'python'
export default defineConfig({
  testDir: './e2e', timeout: 45000, fullyParallel: false, workers: 1,
  reporter: [['list'], ['json', { outputFile: process.env.PLAYWRIGHT_JSON_FILE || '../qa/playwright-results.json' }]],
  outputDir: '../qa/browser-artifacts',
  use: { baseURL: 'http://127.0.0.1:5173', headless: true, launchOptions: { executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: `cd ../backend && "${python}" -m alembic upgrade head && "${python}" -m app.seed && "${python}" -m uvicorn app.main:app --host 127.0.0.1 --port 8000`, url: 'http://127.0.0.1:8000/api/v1/health', timeout: 120000,
      env: { DATABASE_URL: `sqlite:///${dir}/browser.db`, UPLOAD_DIR: `${dir}/uploads` }, reuseExistingServer: false },
    { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 5173', url: 'http://127.0.0.1:5173', timeout: 60000, env: { VITE_API_BASE_URL: 'http://127.0.0.1:8000/api/v1' }, reuseExistingServer: false },
  ],
})
