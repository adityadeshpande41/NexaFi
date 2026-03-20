import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve Vite static build in production
if (process.env.NODE_ENV === "production") {
  // STATIC_DIR can be overridden; defaults to sibling dist/public from repo root
  const staticDir = process.env.STATIC_DIR ||
    path.resolve(__dirname, "../../artifacts/nexafi/dist/public");
  app.use(express.static(staticDir));
  // SPA fallback — all non-API routes serve index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
