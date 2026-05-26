from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
FEATURE = ROOT / "src" / "features" / "calculator"


def read(name: str) -> str:
    return (FEATURE / name).read_text(encoding="utf-8")


def test_calculator_root_is_client_component_and_uses_mui_surface():
    source = read("Calculator.tsx")
    assert source.lstrip().startswith("'use client';") or source.lstrip().startswith('"use client";')
    for component in ["Container", "Paper", "Box", "Typography"]:
        assert f"@mui/material/{component}" in source or f"import {{ {component}" in source
    assert "useCalculator()" in source
    assert "<CalculatorDisplay" in source
    assert "<CalculatorKeypad" in source
    assert "overflowX: 'hidden'" in source or 'overflowX: "hidden"' in source


def test_display_is_accessible_and_shows_values_or_errors():
    source = read("CalculatorDisplay.tsx")
    assert "aria-label=\"Calculator display\"" in source
    assert "role=\"status\"" in source
    assert "aria-live=\"polite\"" in source
    assert "error ?? displayValue" in source
    assert "data-testid=\"calculator-display\"" in source
    assert "Typography" in source and "Paper" in source and "Box" in source


def test_keypad_renders_buttons_from_declarative_configuration():
    source = read("CalculatorKeypad.tsx")
    assert "calculatorButtonConfig" in source
    assert re.search(r"calculatorButtonConfig\.map\(\(?\s*\(?button", source)
    assert "<CalculatorButton" in source
    assert "onPress={dispatch}" in source
    for action in ["clear", "toggleSign", "percent", "decimal", "equals"]:
        assert f"type: '{action}'" in source or f'type: "{action}"' in source
    for operator in ["add", "subtract", "multiply", "divide"]:
        assert f"operator: '{operator}'" in source or f'operator: "{operator}"' in source
    for digit in "0123456789":
        assert f"value: '{digit}'" in source or f'value: "{digit}"' in source


def test_buttons_dispatch_configured_actions_and_have_distinct_treatments():
    source = read("CalculatorButton.tsx")
    assert "onClick={() => onPress(button.action)}" in source
    assert "variantByKind" in source
    assert "colorByKind" in source
    for kind in ["digit", "operator", "utility", "equals"]:
        assert kind in source
    assert "minHeight: { xs: 56, sm: 64 }" in source
    assert "touchAction: 'manipulation'" in source or 'touchAction: "manipulation"' in source
    assert "aria-label={button.ariaLabel}" in source


def test_reducer_contains_divide_by_zero_error_and_no_persistence_or_network_calls():
    combined = "\n".join(path.read_text(encoding="utf-8") for path in FEATURE.glob("*.ts*"))
    assert "Cannot divide by zero" in combined
    forbidden = ["fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "indexedDB", "document.cookie"]
    for token in forbidden:
        assert token not in combined
