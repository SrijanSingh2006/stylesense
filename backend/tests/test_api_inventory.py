import pytest
from app.main import app

# Derived from registered OpenAPI routes, not an assumed README list.
GET_PATHS=[p for p,v in app.openapi()['paths'].items() if 'get' in v and p.startswith('/api/v1')]
PARAMS={'product_id':'101','customer_id':'1','experiment_id':'1','segment_name':'Champions','flag_id':'1','release_id':'1','issue_id':'1','user_id':'1','order_id':'1','address_id':'999','item_id':'999','notification_id':'999','invitation_id':'999'}
@pytest.mark.parametrize('path',GET_PATHS)
def test_registered_get_routes(client,path):
    resolved=path
    for name,value in PARAMS.items():resolved=resolved.replace('{'+name+'}',value)
    response=client.get(resolved)
    expected=404 if path=="/api/v1/users/me/orders/{order_id}" else 200
    assert response.status_code==expected,(path,response.text)
    assert response.json() is not None

WRITE_PATHS=[(method,p) for p,v in app.openapi()['paths'].items() for method in v if method in ['post','patch','put'] and p.startswith('/api/v1')]
@pytest.mark.parametrize('method,path',WRITE_PATHS)
def test_invalid_write_requests_are_not_500(client,method,path):
    resolved=path
    for name,value in PARAMS.items():resolved=resolved.replace('{'+name+'}',value)
    if '{' in resolved: resolved=resolved.replace('{feedback_id}','999').replace('{task_id}','999')
    response=getattr(client,method)(resolved,json={})
    assert response.status_code in (200,400,401,403,404,409,422),(method,path,response.text)

def test_database_failure_has_safe_error(client,db,monkeypatch):
    from sqlalchemy.orm import Session
    from sqlalchemy.exc import OperationalError
    original=Session.execute
    def fail(*args,**kwargs):raise OperationalError('private sql',{},Exception('private database path'))
    monkeypatch.setattr(Session,'execute',fail)
    res=client.get('/api/v1/products')
    assert res.status_code==503
    assert 'private' not in res.text
    monkeypatch.setattr(Session,'execute',original)
    assert db.query(__import__('app.models.order',fromlist=['Order']).Order).count()==150
