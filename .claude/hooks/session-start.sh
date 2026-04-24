#!/bin/bash
# SessionStart hook — installs dependencies so lint / typecheck work in
# Claude Code on the web. Idempotent: safe to re-run.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

if command -v bun >/dev/null 2>&1; then
  bun install
else
  npm install --no-audit --no-fund
fi
