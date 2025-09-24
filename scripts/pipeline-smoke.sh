#!/usr/bin/env bash
set -euo pipefail

LOG_DIR=${1:-./artifacts/pipeline}
mkdir -p "$LOG_DIR"

run_step() {
  local name="$1"
  shift
  echo "[pipeline] Running $name" | tee -a "$LOG_DIR/steps.log"
  "$@" | tee "$LOG_DIR/${name// /-}.log"
}

run_step "lint" npm run lint:check
run_step "type-check" npm run type-check
run_step "tests" npm test -- --run
run_step "build" npm run build

echo "[pipeline] Completed successfully" | tee -a "$LOG_DIR/steps.log"
