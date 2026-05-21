import threading
import time

class InMemoryCounterStorage:
    def __init__(self):
        self._lock = threading.Lock()
        self._value = None
        self._last_modified = None

    def increment(self, amount=1):
        if amount < 1:
            raise ValueError("Increment amount must be >= 1")
        with self._lock:
            if self._value is None:
                self._value = 0
            self._value += amount
            self._last_modified = time.time()
            return self._value, self._last_modified

    def get(self):
        with self._lock:
            if self._value is None:
                return None, None
            return self._value, self._last_modified
