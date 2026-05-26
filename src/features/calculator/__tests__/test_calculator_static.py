from pathlib import Path

CALCULATOR_DIR = Path(__file__).resolve().parents[1]


def read_file(name: str) -> str:
    return (CALCULATOR_DIR / name).read_text(encoding='utf-8')


def test_required_type_exports_are_present() -> None:
    contents = read_file('types.ts')

    for export_name in [
        'CalculatorState',
        'CalculatorAction',
        'Operator',
        'ButtonConfig',
        'CalculationResult',
    ]:
        assert f'export interface {export_name}' in contents or f'export type {export_name}' in contents


def test_engine_uses_explicit_arithmetic_helpers_without_string_evaluation() -> None:
    contents = read_file('calculatorEngine.ts')

    for helper_name in ['add', 'subtract', 'multiply', 'divide', 'compute']:
        assert f'export function {helper_name}' in contents

    forbidden_tokens = ['eval(', 'new Function', 'Function(']
    for token in forbidden_tokens:
        assert token not in contents


def test_deterministic_error_literals_and_finite_number_guards_are_present() -> None:
    engine_contents = read_file('calculatorEngine.ts')
    format_contents = read_file('calculatorFormat.ts')

    assert 'Cannot divide by zero' in engine_contents
    assert 'Invalid number' in format_contents
    assert 'Number.isFinite' in format_contents
    assert 'ERROR_DISPLAY' in format_contents
