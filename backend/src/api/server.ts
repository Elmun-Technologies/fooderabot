import cors from "cors";
import express from "express";
import { config } from "../config";
import { webappRouter } from "./webapp";

export function createServer() {
  const app = express();
  app.use(express.json({ limit: "100kb" }));
  app.use(
    cors({
      origin: config.corsOrigin.length ? config.corsOrigin : true,
    }),
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/webapp", webappRouter);

  return app;
}
