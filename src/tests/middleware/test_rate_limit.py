import time
import pytest
from src.middleware.rate_limit import RateLimiter, rate_limit_upload

# Dummy upload function
def dummy_upload(user_id):
    return f"Image uploaded by {user_id}"

def test_rate_limiter_allows_within_limit():
    limiter = RateLimiter(max_requests=3, window_seconds=2)
    wrapped = rate_limit_upload(limiter)(dummy_upload)
    user = "user1"
    # Should allow 3 uploads
    assert wrapped(user) == "Image uploaded by user1"
    assert wrapped(user) == "Image uploaded by user1"
    assert wrapped(user) == "Image uploaded by user1"
    # 4th should fail
    with pytest.raises(Exception, match="Rate limit exceeded for image upload"):
        wrapped(user)

def test_rate_limiter_resets_after_window():
    limiter = RateLimiter(max_requests=2, window_seconds=1)
    wrapped = rate_limit_upload(limiter)(dummy_upload)
    user = "user2"
    assert wrapped(user) == "Image uploaded by user2"
    assert wrapped(user) == "Image uploaded by user2"
    with pytest.raises(Exception):
        wrapped(user)
    # Wait for window to reset
    time.sleep(1.1)
    assert wrapped(user) == "Image uploaded by user2"

def test_rate_limiter_is_per_user():
    limiter = RateLimiter(max_requests=1, window_seconds=1)
    wrapped = rate_limit_upload(limiter)(dummy_upload)
    user_a = "userA"
    user_b = "userB"
    assert wrapped(user_a) == "Image uploaded by userA"
    assert wrapped(user_b) == "Image uploaded by userB"
    with pytest.raises(Exception):
        wrapped(user_a)
    with pytest.raises(Exception):
        wrapped(user_b)
