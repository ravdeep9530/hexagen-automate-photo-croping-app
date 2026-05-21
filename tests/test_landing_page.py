import importlib.util
import os
import sys
import types

import pytest

# Helper to import the Home component from pages/index.tsx
# We'll simulate a render by checking the function and its output

def load_home_component():
    path = os.path.join(os.path.dirname(__file__), '../pages/index.tsx')
    with open(path, 'r') as f:
        code = f.read()
    # Extract the Home function
    start = code.find('export default function Home')
    assert start != -1, 'Home component not found'
    # We'll just check that the function exists and returns JSX-like output
    return code

def test_home_component_exists():
    code = load_home_component()
    assert 'function Home()' in code
    assert 'Welcome to Shadcn Next.js App' in code
    assert 'Shadcn Button' in code

def test_package_manager_is_pnpm():
    pkg_path = os.path.join(os.path.dirname(__file__), '../package.json')
    import json
    with open(pkg_path) as f:
        pkg = json.load(f)
    assert 'packageManager' in pkg
    assert pkg['packageManager'].startswith('pnpm')

def test_shadcn_dependency_present():
    pkg_path = os.path.join(os.path.dirname(__file__), '../package.json')
    import json
    with open(pkg_path) as f:
        pkg = json.load(f)
    deps = pkg.get('dependencies', {})
    assert any('shadcn' in k for k in deps.keys())
