from datetime import datetime, timedelta
from decimal import Decimal
import math
import pytest
from app.models.customer import Customer
from app.models.product import Product
from app.models.event import Event
from app.models.order import Order, OrderItem
from app.models.returns import Return
from app.models.experiment import Experiment, ExperimentAssignment
from app.services.analytics import calculate_cohort_retention, calculate_funnel, calculate_overview_metrics, get_product_performance
from app.services.experimentation import calculate_experiment_results

@pytest.fixture
def dataset(db):
    db.add_all([Customer(id=i,display_name=f'Customer {i}') for i in range(1,5)])
    db.add(Product(id=1,sku='metric',name='Metric shirt',brand='Test',category='Shirts',colour='Blue',price=9999,stock_quantity=10,sizes_available=['M']))
    db.commit()
    return db

def event(db,cid,time,kind='product_view',session=None,**kw):
    db.add(Event(customer_id=cid,session_id=session or f's-{cid}',product_id=kw.pop("product_id",1),event_type=kind,occurred_at=time,**kw))

def order(db,cid,time,total='20.00',status='COMPLETED',session=None):
    o=Order(customer_id=cid,session_id=session or f's-{cid}',total_amount=Decimal(total),status=status,created_at=time)
    db.add(o);db.flush();return o

def test_empty_analytics(db):
    assert calculate_cohort_retention(db).cohorts==[]
    assert calculate_funnel(db).total_sessions==0
    metrics=calculate_overview_metrics(db)
    assert all(getattr(metrics,f)==0 for f in ['total_sessions','unique_visitors','total_orders','conversion_rate','return_rate','cart_abandonment_rate','average_order_value'])

def test_hand_calculated_cohorts(dataset):
    db=dataset
    monday=datetime(2026,1,5)
    for c in [1,2]: event(db,c,monday+timedelta(hours=1))
    event(db,1,monday+timedelta(days=8));event(db,1,monday+timedelta(days=8,hours=1))
    event(db,2,monday+timedelta(days=15))
    event(db,3,monday+timedelta(days=7))
    db.commit()
    rows=calculate_cohort_retention(db,now=monday+timedelta(days=30)).cohorts
    assert rows[0].cohort_size==2
    assert [w.retention_rate for w in rows[0].weeks]==[100,50,50,0,None]
    assert rows[0].weeks[4].observed is False
    assert rows[1].cohort_size==1

def test_ordered_funnel_deduplicates(dataset):
    db=dataset;now=datetime.utcnow()-timedelta(hours=1)
    stages=['homepage_view','search','product_view','add_to_cart','checkout_started','purchase']
    for i,k in enumerate(stages):
        event(db,1,now+timedelta(seconds=i),k)
        event(db,1,now+timedelta(seconds=i,microseconds=1),k)
    for i,k in enumerate(stages[:3]):event(db,2,now+timedelta(seconds=i),k)
    event(db,3,now,'purchase');event(db,3,now+timedelta(seconds=1),'homepage_view')
    db.commit()
    funnel=calculate_funnel(db)
    assert [s.count for s in funnel.steps]==[3,2,2,1,1,1]
    assert funnel.steps[1].drop_off_count==1
    assert funnel.steps[-1].overall_conversion==33.33

def test_historical_revenue_status_and_dates(dataset):
    db=dataset;now=datetime.utcnow()-timedelta(hours=1)
    o=order(db,1,now,total='25.50')
    db.add(OrderItem(order_id=o.id,product_id=1,quantity=3,unit_price=Decimal('8.50'),selected_size='M'))
    cancelled=order(db,2,now,total='100',status='CANCELLED')
    db.add(OrderItem(order_id=cancelled.id,product_id=1,quantity=10,unit_price=10,selected_size='M'))
    old=order(db,3,now-timedelta(days=60),total='100')
    db.add(OrderItem(order_id=old.id,product_id=1,quantity=10,unit_price=10,selected_size='M'))
    for cid in [1,2]:event(db,cid,now)
    # Duplicate return lines for the same order must count as one returned order.
    for _ in range(2): db.add(Return(order_id=o.id,product_id=1,customer_id=1,return_reason='Size too small'))
    db.commit()
    product=get_product_performance(db)[0]
    assert product.revenue==25.50 and product.purchases==3 and product.return_rate==100
    assert product.ctr is None
    metrics=calculate_overview_metrics(db)
    assert metrics.total_revenue==25.50 and metrics.average_order_value==25.50
    assert metrics.return_rate==100 and metrics.conversion_rate==50
    assert get_product_performance(db,customer_id=2)[0].revenue==0

def test_ctr_requires_matching_impressions(dataset):
    db=dataset;now=datetime.utcnow()-timedelta(hours=1)
    event(db,1,now,'recommendation_impression');event(db,1,now,'recommendation_impression')
    event(db,1,now,'recommendation_click');event(db,2,now,'recommendation_click')
    db.commit();assert get_product_performance(db)[0].ctr==100

def experiment(db,n1,n2,x1,x2):
    now=datetime.utcnow();start=now-timedelta(days=2);exposure=now-timedelta(days=1)
    db.add(Experiment(id=1,name='Test',hypothesis='Test',status='RUNNING',primary_metric='conversion_rate',start_date=start))
    db.flush()
    cid=1
    for variant,n,x in [('control',n1,x1),('treatment',n2,x2)]:
        for index in range(n):
            db.add(Customer(id=cid,display_name=str(cid)));db.flush()
            db.add(ExperimentAssignment(experiment_id=1,customer_id=cid,variant=variant,assigned_at=start))
            event(db,cid,exposure,'experiment_exposure',product_id=None,experiment_id=1,variant=variant)
            if index<x:
                order(db,cid,now-timedelta(hours=1))
                order(db,cid,now-timedelta(minutes=30))
            cid+=1
    db.commit()
    return now

@pytest.mark.parametrize('n1,n2,x1,x2',[(0,0,0,0),(2,3,0,0),(1,1,1,1),(5,10,0,2),(10,10,1,9),(1000,1000,100,130)])
def test_experiment_actual_samples_and_unique_converters(db,n1,n2,x1,x2):
    experiment(db,n1,n2,x1,x2)
    result=calculate_experiment_results(db,1)
    assert result.control.sample_size==n1 and result.treatment.sample_size==n2
    assert result.control.conversions==x1 and result.treatment.conversions==x2
    assert 0<=result.p_value<=1
    if not n1 or not n2: assert result.is_statistically_significant is False
    if (n1,n2,x1,x2)==(10,10,1,9):
        assert result.statistical_test.startswith('Fisher')
        assert result.p_value==pytest.approx(0.0010933339,rel=1e-6)
    if n1==1000:
        # Independent hand calculation: pooled p=.115, delta=.03.
        expected=.03/math.sqrt(.115*.885*.002)
        assert result.z_score==pytest.approx(expected,abs=1e-6)
        assert result.p_value==pytest.approx(math.erfc(expected/math.sqrt(2)),rel=1e-8)

def test_attribution_excludes_pre_exposure_and_outside_window(db):
    now=experiment(db,2,2,0,0)
    order(db,1,now-timedelta(days=1,hours=1)) # before exposure
    order(db,2,now-timedelta(days=3)) # before experiment
    order(db,3,now+timedelta(hours=1)) # future
    db.commit()
    assert calculate_experiment_results(db,1).control.conversions==0
    assert calculate_experiment_results(db,1).treatment.conversions==0
    db.query(Event).filter(Event.customer_id==4).update({'variant':'control'});db.commit()
    assert calculate_experiment_results(db,1).treatment.exposed_users==1

def test_recorded_events_validate_assignment(empty_client,db,authenticate):
    now=experiment(db,1,1,0,0)
    authenticate(role="admin",customer_id=1)
    data={'customer_id':1,'session_id':'real','event_type':'experiment_exposure','experiment_id':1,'variant':'treatment'}
    assert empty_client.post('/api/v1/events',json=data).status_code==409
    data['variant']='control'
    assert empty_client.post('/api/v1/events',json=data).status_code==200
    db.get(Experiment,1).status='PAUSED';db.commit()
    assert empty_client.post('/api/v1/events',json=data).status_code==409
    assert empty_client.post('/api/v1/experiments/1/assign?customer_id=1').status_code==200 # stable existing assignment

def test_inventory_forecast_uses_only_recent_completed_quantities(dataset):
    from app.services.inventory import get_inventory_forecast
    db=dataset;now=datetime.utcnow()-timedelta(days=1)
    for status,time,quantity in [('COMPLETED',now,28),('CANCELLED',now,100),('COMPLETED',now-timedelta(days=50),100)]:
        o=order(db,1,time,status=status)
        db.add(OrderItem(order_id=o.id,product_id=1,quantity=quantity,unit_price=1,selected_size='M'))
    db.commit();forecast=get_inventory_forecast(db,1)
    assert forecast.daily_run_rate_units==1
    assert sum(forecast.historical_weekly_sales)==28

def test_rfm_and_returns_use_stored_orders(dataset):
    from app.services.segmentation import calculate_customer_segments
    from app.services.returns import get_return_overview
    db=dataset;now=datetime.utcnow()-timedelta(hours=1)
    first=None
    for _ in range(4):
        o=order(db,1,now,total='3000')
        db.add(OrderItem(order_id=o.id,product_id=1,quantity=1,unit_price=3000,selected_size='M'))
        first=first or o
    order(db,2,now,total='999999',status='CANCELLED')
    for _ in range(2):db.add(Return(order_id=first.id,customer_id=1,product_id=1,return_reason='Size too small'))
    db.commit()
    segments=calculate_customer_segments(db)
    customer=next(c for c in segments.customers if c.customer_id==1)
    assert customer.segment=='Champions' and customer.frequency_orders==4 and customer.monetary_spend==12000
    returns=get_return_overview(db)
    assert returns.total_orders==4 and returns.overall_return_rate==25
    assert returns.category_breakdown[0].total_orders==4 and returns.category_breakdown[0].returned_orders==1
