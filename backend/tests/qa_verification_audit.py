"""Compatibility audit command. Uses isolated pytest fixtures, never a running server."""
from pathlib import Path
import subprocess, sys
if __name__ == '__main__':
    root=Path(__file__).resolve().parents[2]
    raise SystemExit(subprocess.call([sys.executable,'-m','pytest','-q','backend/tests/test_api.py','backend/tests/test_metrics.py','backend/tests/test_migrations.py'],cwd=root))
