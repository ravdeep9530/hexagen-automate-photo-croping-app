from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class EmailValidationRequest:
    email: str
    requested_at: datetime
    status: str
    validation_token: Optional[str] = None

    def is_pending(self) -> bool:
        return self.status == 'pending'

    def is_completed(self) -> bool:
        return self.status == 'completed'

    def is_failed(self) -> bool:
        return self.status == 'failed'
