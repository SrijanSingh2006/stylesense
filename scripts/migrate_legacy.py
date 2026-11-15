"""Back up and adopt a verified original SQLite schema without deleting records."""
import argparse, json, sqlite3, sys
from datetime import datetime, UTC
from pathlib import Path
from sqlalchemy import create_engine, inspect
from alembic import command
from alembic.config import Config
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'backend'))
from app.core.config import settings

def migrate(url):
    engine=create_engine(url);inspector=inspect(engine);tables=set(inspector.get_table_names())
    config=Config(str(root/'backend/alembic.ini'));config.attributes['database_url']=url
    if tables and 'alembic_version' not in tables:
        baseline=json.loads((root/'backend/migrations/baseline_schema.json').read_text())
        if tables != set(baseline) or any(set(c['name'] for c in inspector.get_columns(t))!=set(cols) for t,cols in baseline.items()):
            raise RuntimeError('Database does not match the original baseline. No schema changes made.')
        if engine.dialect.name=='sqlite':
            source=Path(engine.url.database).resolve()
            destination=source.with_name(source.name+'.backup-'+datetime.now(UTC).strftime('%Y%m%dT%H%M%S%f'))
            with sqlite3.connect(source) as src, sqlite3.connect(destination) as dst:src.backup(dst)
            print(f'Backup: {destination}')
        else:
            raise RuntimeError('Back up PostgreSQL and follow the documented baseline adoption procedure before stamping.')
        command.stamp(config,'0001')
    engine.dispose();command.upgrade(config,'head')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--database-url',default=settings.DATABASE_URL)
    migrate(parser.parse_args().database_url)
