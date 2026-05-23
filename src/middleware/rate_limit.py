import time
from typing import Callable, Dict

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}

    def is_allowed(self, user_id: str) -> bool:
        now = time.time()
        if user_id not in self.requests:
            self.requests[user_id] = []
        # Remove requests outside the window
        self.requests[user_id] = [t for t in self.requests[user_id] if now - t < self.window_seconds]
        if len(self.requests[user_id]) < self.max_requests:
            self.requests[user_id].append(now)
            return True
        return False

def rate_limit_upload(rate_limiter: RateLimiter):
    def decorator(func: Callable):
        def wrapper(user_id: str, *args, **kwargs):
            if not rate_limiter.is_allowed(user_id):
                raise Exception("Rate limit exceeded for image upload")
            return func(user_id, *args, **kwargs)
        return wrapper
    return decorator
