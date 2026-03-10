import redis
from app.config import settings

def get_redis():
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        return redis_client
    except Exception as e:
        print(f"Redis connection failed: {e}")
        return None
