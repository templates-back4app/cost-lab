#!/usr/bin/env bash
# The same feature, built twice, held to the same acceptance battery, then counted.
#
#   ./run.sh
#
# Needs Docker, Node 22 and one npm dependency (a real tokenizer).
set -euo pipefail
cd "$(dirname "$0")"
export SCRATCH_PORT=7401 PARSE_PORT=1340

PIDS=()
cleanup() { for p in "${PIDS[@]:-}"; do kill "$p" 2>/dev/null || true; done
  docker compose down -v >/dev/null 2>&1 || true; }
trap cleanup EXIT

wait_port() { for _ in $(seq 1 80); do nc -z 127.0.0.1 "$1" 2>/dev/null && return 0; sleep 0.25; done
  echo "nothing came up on $1" >&2; return 1; }

echo ""
echo "  [1/4] writing the backend yourself"
node from-scratch/server.mjs 2>/dev/null & PIDS+=($!)
wait_port $SCRATCH_PORT
node verify/acceptance.mjs from-scratch

echo ""
echo "  [2/4] the same feature on a backend that already exists"
docker compose down -v >/dev/null 2>&1 || true
docker compose up -d >/dev/null
docker compose restart parse >/dev/null
wait_port $PARSE_PORT
for _ in $(seq 1 80); do
  curl -sf -o /dev/null -H 'X-Parse-Application-Id: cost-app' \
    "http://127.0.0.1:$PARSE_PORT/parse/users?limit=0" && break
  sleep 0.25
done
node on-a-backend/setup.mjs
node verify/acceptance.mjs on-a-backend

echo ""
echo "  [3/4] what it took to get there"
node count.mjs

echo "  [4/4] and what happens when that code is slightly wrong"
node slips.mjs
