$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location "$ProjectRoot/backend"
try {
    if (-not (Test-Path '.venv/Scripts/python.exe')) { py -3 -m venv .venv }
    & .venv/Scripts/python.exe -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed' }
    & .venv/Scripts/python.exe ../scripts/migrate_legacy.py
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed; existing data retained' }
    & .venv/Scripts/python.exe -m app.seed
    if ($LASTEXITCODE -ne 0) { throw 'Seed failed' }
} finally { Pop-Location }
Push-Location "$ProjectRoot/frontend"
try { npm ci; if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' } } finally { Pop-Location }
Write-Host 'Setup complete. See README.md for server and test commands.'
