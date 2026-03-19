/**
 * chat.ts - Proxy route that forwards /api/chat to the Python FastAPI backend.
 *
 * The frontend calls POST /api/chat → Express forwards to FastAPI on PYTHON_API_URL.
 * This avoids CORS issues and keeps a single origin for the frontend.
 */

import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const PYTHON_API = (process.env["PYTHON_API_URL"] || "http://localhost:8000").replace(/\/$/, "");

async function proxyToPython(path: string, req: Request, res: Response) {
  try {
    const url = `${PYTHON_API}${path}`;
    const isGet = req.method === "GET";

    const fetchRes = await fetch(url, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: isGet ? undefined : JSON.stringify(req.body),
    });

    const data = await fetchRes.json();
    res.status(fetchRes.status).json(data);
  } catch (err: any) {
    console.error("[proxy error]", err?.message);
    res.status(502).json({ error: "Could not reach Python backend", detail: err?.message });
  }
}

// POST /api/chat  →  FastAPI POST /chat
router.post("/chat", (req, res) => proxyToPython("/chat", req, res));

// GET /api/nova-health  →  FastAPI GET /health
router.get("/nova-health", (req, res) => proxyToPython("/health", req, res));

export default router;
