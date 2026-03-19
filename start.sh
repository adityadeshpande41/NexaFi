#!/bin/bash
# start.sh - Start the full NexaFi stack locally
# Runs: Python FastAPI (8000) + Express proxy (3001) + Vite frontend (5173)

echo "Starting NexaFi stack..."

# Kill anything already on these ports
lsof -ti:8000,3001,5173 | xargs kill -9 2>/dev/null || true

# 1. Python FastAPI backend
echo "[1/3] Starting Python FastAPI on :8000..."
(cd backend && python -m uvicorn app:app --reload --port 8000) &
FASTAPI_PID=$!

# Wait for FastAPI to be ready
sleep 3

# 2. Express proxy server
echo "[2/3] Starting Express proxy on :3001..."
(PORT=3001 PYTHON_API_URL=http://localhost:8000 pnpm --filter @workspace/api-server run dev) &
EXPRESS_PID=$!

sleep 2

# 3. Vite frontend
echo "[3/3] Starting Vite frontend on :5173..."
(PORT=5173 BASE_PATH=/ API_PORT=3001 pnpm --filter @workspace/nexafi run dev) &
VITE_PID=$!

echo ""
echo "NexaFi is running:"
echo "  Frontend  →  http://localhost:5173"
echo "  API proxy →  http://localhost:3001/api/chat"
echo "  FastAPI   →  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services."

# Wait and clean up on exit
trap "kill $FASTAPI_PID $EXPRESS_PID $VITE_PID 2>/dev/null; exit" INT TERM
wait
