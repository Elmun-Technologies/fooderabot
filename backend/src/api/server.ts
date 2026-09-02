import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config";
import { webappRouter } from "./webapp";

function resolveStaticDir(): string | null {
  const candidates = [
    process.env.WEBAPP_STATIC_DIR,
    // Fly image layout (root Dockerfile copies the built web app here)
    "/app/public",
    // Local dev convenience: backend run from the repo
    path.join(process.cwd(), "..", "webapp", "dist"),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  return null;
}

export function createServer() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(
    cors({
      // The API is authenticated via the Telegram initData HMAC header, not
      // cookies, so reflecting the caller origin is safe and removes a whole
      // class of "CORS blocked my registration" deploy failures. An explicit
      // CORS_ORIGIN list still wins when an operator really wants to lock it down.
      origin: config.corsOrigin.length ? config.corsOrigin : true,
    }),
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/webapp", webappRouter);

  // Unknown API routes must answer JSON — an HTML SPA fallback here would be
  // read by the client as a broken response and lose the lead.
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  // Serve the built web app from the same origin as the API (recommended
  // production setup: one HTTPS domain for the Mini App and its API).
  const staticDir = resolveStaticDir();
  if (staticDir) {
    app.use(express.static(staticDir, { index: "index.html" }));
    app.get("*", (_req, res) => res.sendFile(path.join(staticDir, "index.html")));
    console.log(`Serving web app static files from ${staticDir}`);
  } else {
    app.get("*", (_req, res) => res.status(404).json({ error: "Not found" }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) return next(err);
    console.error("Unhandled API error", err);
    res.status(500).json({ error: "Internal error" });
  });

  return app;
}
