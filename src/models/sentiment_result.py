from dataclasses import dataclass

@dataclass(frozen=True)
class SentimentResult:
    score: int
    magnitude: int
    label: str

    def __post_init__(self):
        if self.score is None:
            raise ValueError("score must not be None")
        if self.magnitude is None:
            raise ValueError("magnitude must not be None")
        if self.label is None:
            raise ValueError("label must not be None")
