"""Compatibility edge-case command; concurrency tests use temporary SQLite databases."""
from pathlib import Path
import subprocess, sys
if __name__ == '__main__':
    root=Path(__file__).resolve().parents[2]
    raise SystemExit(subprocess.call([sys.executable,'-m','pytest','-q','backend/tests/test_reliability.py'],cwd=root))
