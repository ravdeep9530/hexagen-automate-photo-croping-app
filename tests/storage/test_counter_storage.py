import threading
import time
import pytest
from src.storage.counter_storage import InMemoryCounterStorage

def test_initial_state():
    storage = InMemoryCounterStorage()
    value, ts = storage.get()
    assert value is None
    assert ts is None

def test_increment_and_get():
    storage = InMemoryCounterStorage()
    value, ts = storage.increment()
    assert value == 1
    assert isinstance(ts, float)
    value2, ts2 = storage.get()
    assert value2 == 1
    assert ts2 == ts

    value3, ts3 = storage.increment(2)
    assert value3 == 3
    assert ts3 > ts


def test_increment_invalid_amount():
    storage = InMemoryCounterStorage()
    with pytest.raises(ValueError):
        storage.increment(0)
    with pytest.raises(ValueError):
        storage.increment(-5)


def test_concurrent_increment():
    storage = InMemoryCounterStorage()
    num_threads = 10
    increments_per_thread = 100
    def worker():
        for _ in range(increments_per_thread):
            storage.increment()
    threads = [threading.Thread(target=worker) for _ in range(num_threads)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    value, ts = storage.get()
    assert value == num_threads * increments_per_thread
    assert isinstance(ts, float)


def test_last_modified_updates():
    storage = InMemoryCounterStorage()
    _, ts1 = storage.increment()
    time.sleep(0.01)
    _, ts2 = storage.increment()
    assert ts2 > ts1
