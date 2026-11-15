import hashlib
from app.models.feature_flag import FeatureFlag

def feature_enabled(db,name,customer_id):
    flag=db.query(FeatureFlag).filter_by(name=name).first()
    if not flag:return True
    bucket=int(hashlib.sha256(f'{name}:{customer_id}'.encode()).hexdigest()[:8],16)%100
    return bool(flag.enabled and bucket<flag.rollout_percentage)
