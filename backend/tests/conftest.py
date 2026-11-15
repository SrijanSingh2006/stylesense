import os
import tempfile
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Before application imports: even collection-time imports cannot touch development data.
_collection_dir = tempfile.TemporaryDirectory(prefix='stylesense-tests-')
os.environ['DATABASE_URL'] = f'sqlite:///{_collection_dir.name}/collection.sqlite3'
os.environ['UPLOAD_DIR'] = f'{_collection_dir.name}/uploads'
os.environ['AUTH_OUTBOX_DIR'] = f'{_collection_dir.name}/mail'
os.environ['ENVIRONMENT'] = 'test'
os.environ['AUTH_EMAIL_MODE'] = 'outbox'
os.environ['SEED_DEMO_ACCOUNTS'] = 'false'
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
def empty_client(db_engine,tmp_path,monkeypatch):
    from fastapi.testclient import TestClient
    from app.core.auth_config import auth_settings
    monkeypatch.setattr(auth_settings, "outbox", tmp_path / "mail")
    factory=sessionmaker(bind=db_engine)
    def override():
        with factory() as session: yield session
    app.dependency_overrides[get_db]=override
    with TestClient(app,raise_server_exceptions=False,headers={"Origin":"http://127.0.0.1:5173"}) as client: yield client
    app.dependency_overrides.clear()

@pytest.fixture
def client(empty_client,db_engine):
    from app.seed import seed_database
    seed_database(session_factory=sessionmaker(bind=db_engine))
    with sessionmaker(bind=db_engine)() as db:
        authenticate_client(db,empty_client,role='admin',customer_id=1)
    yield empty_client


def authenticate_client(db,client,role='customer',customer_id=None,email=None):
    from app.api.routes.auth import create_account
    from app.services.security import create_session,session_response
    from app.core.auth_config import COOKIE_NAME,COOKIE_PATH
    from types import SimpleNamespace
    from uuid import uuid4
    user=create_account(db,'Test '+role,(email or str(uuid4())+'@example.com'),'TestPassword2026!',role=role,verified=True)
    if customer_id is not None:
        # Explicit test-only link; real account creation never claims a legacy customer.
        user.customer_id=customer_id
    session,raw,csrf=create_session(db,user,SimpleNamespace(headers={'user-agent':'pytest'}))
    if customer_id is not None:
        from app.models.account import UserAddress
        db.add(UserAddress(user_id=user.id,full_name="Test Shopper",phone="9999999999",address_line_1="10 Test Street",city="Bengaluru",state="Karnataka",postal_code="560001",country="IN",is_default=True))
    db.commit()
    result=session_response(user,session,csrf)
    client.headers.update({'Authorization':'Bearer '+result['access_token'],'X-CSRF-Token':csrf})
    client.cookies.set(COOKIE_NAME,raw,path=COOKIE_PATH)
    return user,result

@pytest.fixture
def authenticate(db,empty_client):
    return lambda **kwargs:authenticate_client(db,empty_client,**kwargs)
