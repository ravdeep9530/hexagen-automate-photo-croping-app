import pytest
from src.models.sentiment_result import SentimentResult

def test_sentiment_result_creation():
    result = SentimentResult(score=5, magnitude=10, label="positive")
    assert result.score == 5
    assert result.magnitude == 10
    assert result.label == "positive"

def test_sentiment_result_score_non_nullable():
    with pytest.raises(ValueError) as exc:
        SentimentResult(score=None, magnitude=10, label="neutral")
    assert "score must not be None" in str(exc.value)

def test_sentiment_result_magnitude_non_nullable():
    with pytest.raises(ValueError) as exc:
        SentimentResult(score=1, magnitude=None, label="neutral")
    assert "magnitude must not be None" in str(exc.value)

def test_sentiment_result_label_non_nullable():
    with pytest.raises(ValueError) as exc:
        SentimentResult(score=1, magnitude=2, label=None)
    assert "label must not be None" in str(exc.value)
