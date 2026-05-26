from pathlib import Path
import re

PAGE_PATH = Path(__file__).resolve().parents[1] / "app" / "calculator" / "page.tsx"


def read_page() -> str:
    return PAGE_PATH.read_text(encoding="utf-8")


def test_calculator_route_page_exists_and_exports_next_page():
    source = read_page()

    assert PAGE_PATH.exists()
    assert re.search(r"export\s+default\s+function\s+CalculatorPage\s*\(", source)


def test_calculator_route_imports_feature_component_without_inline_logic():
    source = read_page()

    assert 'import Calculator from "@/features/calculator/Calculator";' in source
    assert "<Calculator />" in source

    forbidden_logic_markers = [
        "eval(",
        "Function(",
        "useState",
        "useReducer",
        "onClick=",
        "onSubmit=",
    ]
    for marker in forbidden_logic_markers:
        assert marker not in source


def test_calculator_route_has_single_clear_heading_and_metadata_title():
    source = read_page()

    assert 'title: "Calculator"' in source
    assert source.count("<h1") == 1
    assert "id=\"calculator-page-title\"" in source
    assert "aria-labelledby=\"calculator-page-title\"" in source


def test_calculator_route_does_not_add_network_or_backend_submission():
    source = read_page()

    forbidden_markers = [
        "fetch(",
        "axios",
        "XMLHttpRequest",
        "navigator.sendBeacon",
        "action=",
        "method=",
        "api/",
    ]
    for marker in forbidden_markers:
        assert marker not in source


def test_calculator_route_remains_a_server_page_wrapper():
    source = read_page()

    assert '"use client"' not in source
    assert "'use client'" not in source
    assert "Metadata" in source
