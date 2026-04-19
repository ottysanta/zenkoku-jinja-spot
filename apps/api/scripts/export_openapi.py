"""Export the FastAPI app's OpenAPI schema to a JSON file.

This is the **offline fallback** used by `@shrine-spots/types` when the
live dev server on `http://localhost:8000` is not available (e.g. in CI,
in pre-commit hooks, or when a developer just wants to regenerate types
without spinning up uvicorn).

Typical usage (from repo root):

    npm run types:generate

which runs:

    cd apps/api && py scripts/export_openapi.py
    npm -w @shrine-spots/types run generate:file

Standalone usage:

    cd apps/api
    py scripts/export_openapi.py                       # writes ./openapi.json
    py scripts/export_openapi.py --output /tmp/oa.json # custom path
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# Make `import main` work regardless of the cwd from which this is invoked.
_API_ROOT = Path(__file__).resolve().parent.parent
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))


def _default_output() -> Path:
    """`apps/api/openapi.json`."""
    return _API_ROOT / "openapi.json"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Dump FastAPI OpenAPI schema as JSON for offline type generation.",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=_default_output(),
        help="Destination JSON file (default: apps/api/openapi.json).",
    )
    args = parser.parse_args()

    # Import lazily so `--help` works without touching the app.
    from main import app  # type: ignore[import-not-found]

    schema = app.openapi()

    output: Path = args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(schema, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Wrote OpenAPI schema to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
