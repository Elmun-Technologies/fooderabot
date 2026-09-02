import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config";
import { adminRouter } from "./admin";
import { webappRouter } from "./webapp";
import { ipAllowlistMiddleware } from "../lib/ipAllowlist";

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

/**
 * Minimal cookie parser. We don't add `cookie-parser` as a dependency
 * because all we need is `req.cookies[name]`, no signed cookies / no
 * options. Anything fancier can swap this out for the real middleware
 * without touching call sites.
 */
function cookieMiddleware() {
  return (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const header = req.header("cookie");
    const out: Record<string, string> = {};
    if (header) {
      for (const part of header.split(";")) {
        const eq = part.indexOf("=");
        if (eq < 0) continue;
        const name = part.slice(0, eq).trim();
        const value = part.slice(eq + 1).trim();
        if (name) out[name] = decodeURIComponent(value);
      }
    }
    (req as express.Request & { cookies: Record<string, string> }).cookies = out;
    next();
  };
}

export function createServer() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Stage 6: basic hardening headers. Nothing exotic — we just don't
  // want a stray response to claim a different content type or to be
  // embedded in an iframe from a hostile origin.
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    next();
  });

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieMiddleware());
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
  // Stage 7: optional IP allowlist for the admin router. The middleware
  // is a no-op when ADMIN_IP_ALLOWLIST is unset, so local dev is
  // unaffected. We mount it on the path so the public webapp API
  // (track, submit) is never blocked.
  app.use("/api/admin", ipAllowlistMiddleware(), adminRouter);

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
