"""Run the full test suite.

Usage:
    python tests/run_tests.py            # run everything
    python tests/run_tests.py -k auth    # forward extra args straight to pytest
"""

import sys
from pathlib import Path

import pytest

if __name__ == "__main__":
    tests_dir = Path(__file__).resolve().parent
    sys.exit(pytest.main([str(tests_dir), "-v", *sys.argv[1:]]))
