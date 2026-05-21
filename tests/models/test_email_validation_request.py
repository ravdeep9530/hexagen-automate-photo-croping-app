import pytest
from datetime import datetime, timedelta
from src.models.email_validation_request import EmailValidationRequest

def test_email_validation_request_fields():
    now = datetime.utcnow()
    req = EmailValidationRequest(
        email='test@example.com',
        requested_at=now,
        status='pending',
        validation_token='abc123'
    )
    assert req.email == 'test@example.com'
    assert req.requested_at == now
    assert req.status == 'pending'
    assert req.validation_token == 'abc123'

def test_status_methods():
    now = datetime.utcnow()
    req_pending = EmailValidationRequest(
        email='user@domain.com',
        requested_at=now,
        status='pending'
    )
    req_completed = EmailValidationRequest(
        email='user@domain.com',
        requested_at=now,
        status='completed'
    )
    req_failed = EmailValidationRequest(
        email='user@domain.com',
        requested_at=now,
        status='failed'
    )
    assert req_pending.is_pending() is True
    assert req_pending.is_completed() is False
    assert req_pending.is_failed() is False
    assert req_completed.is_pending() is False
    assert req_completed.is_completed() is True
    assert req_completed.is_failed() is False
    assert req_failed.is_pending() is False
    assert req_failed.is_completed() is False
    assert req_failed.is_failed() is True

def test_validation_token_optional():
    now = datetime.utcnow()
    req = EmailValidationRequest(
        email='test@domain.com',
        requested_at=now,
        status='pending'
    )
    assert req.validation_token is None
