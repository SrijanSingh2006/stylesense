from pathlib import Path
import pytest
from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.autogenerate import compare_metadata
from sqlalchemy import create_engine, text, inspect
from app.db.base import Base

BACKEND=Path(__file__).resolve().parents[1]
def config(url):
    c=Config(str(BACKEND/'alembic.ini'));c.attributes['database_url']=url
    return c

def test_fresh_upgrade_and_metadata_consistency(tmp_path):
    url=f'sqlite:///{tmp_path}/migrations.db';c=config(url)
    command.upgrade(c,'head');command.upgrade(c,'head')
    engine=create_engine(url)
    with engine.connect() as connection:
        assert connection.execute(text('select version_num from alembic_version')).scalar()=='0002'
        assert compare_metadata(MigrationContext.configure(connection,opts={'compare_type':True}),Base.metadata)==[]
        assert connection.execute(text('PRAGMA foreign_key_check')).all()==[]
    engine.dispose()

def test_existing_records_preserved(tmp_path):
    url=f'sqlite:///{tmp_path}/legacy.db';c=config(url);command.upgrade(c,'0001')
    engine=create_engine(url)
    with engine.begin() as connection:
        connection.execute(text("INSERT INTO customers (id,display_name) VALUES (1,'Existing shopper')"))
        connection.execute(text("INSERT INTO products (id,sku,name,brand,category,colour,price,stock_quantity) VALUES (1,'EXISTING','Existing shirt','Test','Shirts','Blue',12.25,5)"))
        connection.execute(text("INSERT INTO orders (id,customer_id,total_amount,status) VALUES (1,1,24.50,'COMPLETED')"))
        connection.execute(text("INSERT INTO order_items (id,order_id,product_id,quantity,unit_price) VALUES (1,1,1,2,12.25)"))
    command.upgrade(c,'head')
    with engine.connect() as connection:
        assert connection.execute(text('select quantity,unit_price from order_items')).one()==(2,12.25)
        assert connection.execute(text('select total_amount from orders')).scalar()==24.50
        assert connection.execute(text('select stock_quantity from products')).scalar()==5
        assert connection.execute(text('PRAGMA foreign_key_check')).all()==[]
    engine.dispose()

def test_invalid_legacy_data_stops_without_deletion(tmp_path):
    url=f'sqlite:///{tmp_path}/invalid.db';c=config(url);command.upgrade(c,'0001');engine=create_engine(url)
    with engine.begin() as connection:
        connection.execute(text("INSERT INTO products (id,sku,name,brand,category,colour,price,stock_quantity) VALUES (1,'BAD','Bad','Test','Shirts','Blue',10,-2)"))
    with pytest.raises(RuntimeError,match='No records deleted'): command.upgrade(c,'head')
    with engine.connect() as connection: assert connection.execute(text('select stock_quantity from products')).scalar()==-2
    engine.dispose()

def test_legacy_adoption_creates_backup(tmp_path):
    import importlib.util
    url=f'sqlite:///{tmp_path}/adopt.db';c=config(url);command.upgrade(c,'0001')
    engine=create_engine(url)
    with engine.begin() as connection: connection.execute(text('DROP TABLE alembic_version'))
    engine.dispose()
    spec=importlib.util.spec_from_file_location('migrate_legacy',BACKEND.parent/'scripts/migrate_legacy.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    module.migrate(url)
    assert len(list(tmp_path.glob('adopt.db.backup-*')))==1
    engine=create_engine(url)
    with engine.connect() as connection: assert connection.execute(text('select version_num from alembic_version')).scalar()=='0002'
    engine.dispose()
