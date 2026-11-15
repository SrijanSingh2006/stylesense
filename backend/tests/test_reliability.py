from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4
import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.event import Event
from app.models.inventory import InventoryMovement
from app.models.account import UserWishlistItem as WishlistEntry

@pytest.fixture
def commerce(db, empty_client):
    db.add(Customer(id=1, display_name='Test shopper'))
    for pid in [1, 2]:
        db.add(Product(id=pid, sku=f'TEST-{pid}', name=f'Cotton Shirt {pid}', brand='Test', category='Shirts', colour='Blue',
            price=10.10, stock_quantity=5, sizes_available=['S','M'], active=True, rating=4, review_count=1))
    db.commit()
    from conftest import authenticate_client
    authenticate_client(db,empty_client,role="admin",customer_id=1)
    return empty_client

def payload(qty=2, key=None, **item):
    return {'address_id':1,'customer_id':1,'session_id':'journey', 'idempotency_key':key or str(uuid4()),
            'items':[{'product_id':1,'quantity':qty,'selected_size':'M',**item}]}

def unchanged(db):
    db.expire_all()
    assert db.get(Product,1).stock_quantity == 5
    for model in [Order,OrderItem,InventoryMovement,Event]: assert db.query(model).count()==0

@pytest.mark.parametrize('qty',[0,-2,1.5,True,'2',None])
def test_invalid_quantity_is_atomic(commerce,db,qty):
    assert commerce.post('/api/v1/orders',json=payload(qty)).status_code==422
    unchanged(db)

def test_missing_quantity(commerce,db):
    p=payload(); del p['items'][0]['quantity']
    assert commerce.post('/api/v1/orders',json=p).status_code==422
    unchanged(db)

@pytest.mark.parametrize('qty,remaining',[(1,4),(2,3),(5,0)])
def test_exact_stock_and_money(commerce,db,qty,remaining):
    response=commerce.post('/api/v1/orders',json=payload(qty))
    assert response.status_code==200, response.text
    assert response.json()['total_amount']==float(Decimal('10.10')*qty)
    db.expire_all()
    assert db.get(Product,1).stock_quantity==remaining
    assert db.query(Order).one().total_amount==Decimal('10.10')*qty
    assert db.query(Event).filter_by(event_type='purchase').count()==1

@pytest.mark.parametrize('item,status',[({'product_id':999},404),({'selected_size':'XXXL'},422),({'product_id':0},422)])
def test_invalid_item(commerce,db,item,status):
    assert commerce.post('/api/v1/orders',json=payload(**item)).status_code==status
    unchanged(db)

def test_insufficient_stock(commerce,db):
    assert commerce.post('/api/v1/orders',json=payload(6)).status_code==400
    unchanged(db)

def test_inactive_product(commerce,db):
    db.get(Product,1).active=False;db.commit()
    assert commerce.post('/api/v1/orders',json=payload()).status_code==404
    unchanged(db)

def test_invalid_customer(commerce,db):
    p=payload();p['customer_id']=999
    assert commerce.post('/api/v1/orders',json=p).status_code==403
    unchanged(db)

@pytest.mark.parametrize('extra',[{'discount':-1},{'discount_percentage':101},{'total_amount':0}])
def test_client_totals_and_discounts_rejected(commerce,db,extra):
    assert commerce.post('/api/v1/orders',json={**payload(),**extra}).status_code==422
    unchanged(db)

def test_multi_item_rollback(commerce,db):
    p=payload();p['items'].append({'product_id':2,'quantity':6,'selected_size':'M'})
    assert commerce.post('/api/v1/orders',json=p).status_code==400
    unchanged(db)
    assert db.get(Product,2).stock_quantity==5

def test_multiple_products(commerce,db):
    p=payload();p['items'].append({'product_id':2,'quantity':1,'selected_size':'S'})
    res=commerce.post('/api/v1/orders',json=p)
    assert res.status_code==200 and res.json()['total_amount']==30.30
    assert len(res.json()['items'])==2

def test_duplicate_lines_cannot_oversell(commerce,db):
    p=payload(3);p['items']*=2
    assert commerce.post('/api/v1/orders',json=p).status_code==400
    unchanged(db)

def test_idempotency_replay_and_conflict(commerce,db):
    p=payload();first=commerce.post('/api/v1/orders',json=p)
    replay=commerce.post('/api/v1/orders',json=p)
    assert first.status_code==replay.status_code==200
    assert first.json()['id']==replay.json()['id']
    p['items'][0]['quantity']=1
    assert commerce.post('/api/v1/orders',json=p).status_code==409
    db.expire_all();assert db.get(Product,1).stock_quantity==3
    assert db.query(Order).count()==db.query(OrderItem).count()==db.query(Event).count()==1

@pytest.mark.parametrize('same_key',[False,True])
def test_concurrent_checkout(commerce,db,same_key):
    p=payload(4)
    requests=[p,p if same_key else payload(4)]
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(lambda x:commerce.post('/api/v1/orders',json=x),requests))
    assert sorted(r.status_code for r in results)==([200,200] if same_key else [200,400])
    db.expire_all();assert db.get(Product,1).stock_quantity==1
    assert db.query(Order).count()==1
    assert db.query(Event).filter_by(event_type='purchase').count()==1

@pytest.mark.parametrize('model,field,value',[(Product,'stock_quantity',-1),(Product,'price',-1)])
def test_database_constraints(commerce,db,model,field,value):
    setattr(db.get(model,1),field,value)
    with pytest.raises(IntegrityError): db.commit()
    db.rollback();unchanged(db)

def test_wishlist_persistence_duplicates_and_unavailable(commerce,db):
    url='/api/v1/wishlist/1/1'
    assert commerce.put(url).status_code==200
    assert commerce.put(url).status_code==200
    assert db.query(WishlistEntry).count()==1
    assert commerce.get('/api/v1/wishlist/1').json()[0]['id']==1
    db.get(Product,1).active=False;db.commit()
    assert commerce.get('/api/v1/wishlist/1').json()[0]['active'] is False
    assert commerce.delete(url).status_code==200
    assert commerce.get('/api/v1/wishlist/1').json()==[]
    assert commerce.put('/api/v1/wishlist/1/999').status_code==404
    assert commerce.get('/api/v1/wishlist/999').status_code==403

def test_event_deduplication_and_validation(commerce,db):
    p={'customer_id':1,'session_id':'s','event_type':'product_view','product_id':1,'event_key':'event-unique'}
    a=commerce.post('/api/v1/events',json=p);b=commerce.post('/api/v1/events',json=p)
    assert a.status_code==b.status_code==200 and a.json()['id']==b.json()['id']
    assert commerce.post('/api/v1/events',json={**p,'product_id':2}).status_code==409
    assert commerce.post('/api/v1/events',json={**p,'event_key':'other','customer_id':999}).status_code==403

def test_test_database_isolation(db_engine):
    from app.db.session import engine
    assert db_engine.url != engine.url
    assert 'test.sqlite3' in str(db_engine.url)
    with engine.connect() as c:
        from sqlalchemy import inspect
        assert 'orders' not in inspect(c).get_table_names()

def test_concurrent_event_deduplication(commerce,db):
    data={'customer_id':1,'session_id':'same','event_type':'product_view','product_id':1,'event_key':'same-browser-event'}
    with ThreadPoolExecutor(max_workers=4) as pool:
        replies=list(pool.map(lambda _:commerce.post('/api/v1/events',json=data),range(4)))
    assert all(r.status_code==200 for r in replies)
    assert len({r.json()['id'] for r in replies})==1
    assert db.query(Event).count()==1

@pytest.mark.parametrize('movement,quantity',[('RESTOCK',-1),('RETURN',-2),('ADJUSTMENT',0),('RESTOCK',1.5),('PURCHASE',-1)])
def test_invalid_movements_leave_stock_unchanged(commerce,db,movement,quantity):
    res=commerce.post('/api/v1/inventory/movements',json={'product_id':1,'movement_type':movement,'quantity':quantity})
    assert res.status_code==422
    unchanged(db)

def test_flag_changes_real_recommendation_availability(commerce,db):
    from app.models.feature_flag import FeatureFlag
    db.add(FeatureFlag(name='personalisation',enabled=False,rollout_percentage=100));db.commit()
    assert commerce.get('/api/v1/recommendations/1').json()['strategy']=='cold_start_popular'
    flag=db.query(FeatureFlag).one();flag.enabled=True;db.commit()
    assert commerce.get('/api/v1/recommendations/1').json()['strategy']=='hybrid_affinity_diversity'
    assert commerce.get('/api/v1/feature-flags/eligibility/1').json()['personalisation'] is True

def test_database_commit_failure_rolls_back_all_effects(commerce,db,monkeypatch):
    from sqlalchemy.orm import Session
    from sqlalchemy.exc import OperationalError
    def fail_commit(self):raise OperationalError('private SQL',{},Exception('private storage path'))
    with monkeypatch.context() as patch:
        patch.setattr(Session,'commit',fail_commit)
        res=commerce.post('/api/v1/orders',json=payload())
    assert res.status_code==503 and 'private' not in res.text
    unchanged(db)

def test_nonfinite_catalogue_price_rejected_at_checkout(commerce,db):
    db.get(Product,1).price=float('inf');db.commit()
    assert commerce.post('/api/v1/orders',json=payload()).status_code==400
    unchanged(db)

def test_seed_is_non_destructive_and_idempotent(client,db,db_engine):
    from app.seed import seed_database
    from sqlalchemy.orm import sessionmaker
    before=[db.query(model).count() for model in (Customer,Product,Order,Event)]
    seed_database(session_factory=sessionmaker(bind=db_engine))
    db.expire_all()
    assert [db.query(model).count() for model in (Customer,Product,Order,Event)]==before
