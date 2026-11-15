import os
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Before application imports: even collection-time imports cannot touch development data.
_collection_dir = tempfile.TemporaryDirectory(prefix='stylesense-tests-')
os.environ['DATABASE_URL'] = f'sqlite:///{_collection_dir.name}/collection.sqlite3'
os.environ['UPLOAD_DIR'] = f'{_collection_dir.name}/uploads'
from app.main import app
from app.db.base import Base
from app.db.session import get_db, configure_sqlite

@pytest.fixture
def db_engine(tmp_path):
    engine=create_engine(f'sqlite:///{tmp_path}/test.sqlite3',connect_args={'check_same_thread':False,'timeout':30})
    configure_sqlite(engine)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()

@pytest.fixture
def db(db_engine):
    with sessionmaker(bind=db_engine)() as session:
        yield session
        session.rollback()

@pytest.fixture
def empty_client(db_engine):
    from fastapi.testclient import TestClient
    factory=sessionmaker(bind=db_engine)
    def override():
        with factory() as session: yield session
    app.dependency_overrides[get_db]=override
    with TestClient(app,raise_server_exceptions=False) as client: yield client
    app.dependency_overrides.clear()

@pytest.fixture
def client(empty_client,db_engine):
    from app.seed import seed_database
    seed_database(session_factory=sessionmaker(bind=db_engine))
    yield empty_client
