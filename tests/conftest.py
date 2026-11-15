"""Load the pure modules without importing Home Assistant.

``custom_components/ha_inventory/__init__.py`` needs Home Assistant, so we
register a bare stand-in package that only knows where the sources live.
"""

import sys
import types
from pathlib import Path

PKG_DIR = Path(__file__).resolve().parent.parent / "custom_components" / "ha_inventory"

for name, path in (
    ("custom_components", PKG_DIR.parent),
    ("custom_components.ha_inventory", PKG_DIR),
):
    if name not in sys.modules:
        module = types.ModuleType(name)
        module.__path__ = [str(path)]
        sys.modules[name] = module
