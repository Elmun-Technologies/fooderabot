import { Router } from "express";
import { config } from "../config";
import { validateInitData } from "../lib/validateInitData";
import { AlreadyRegisteredError, checkRegistration, submitRegistration } from "../services/registration";
import { toSubmitBody, validateSubmitBody } from "./validate";

export const webappRouter = Router();

function getValidatedUser(req: import("express").Request) {
  const initData = req.header("x-telegram-init-data") ?? "";
  return validateInitData(initData, config.botToken);
}

webappRouter.get("/check", async (req, res) => {
  const validated = getValidatedUser(req);
  if (!validated) return res.status(401).json({ error: "Invalid Telegram init data" });

  const result = await checkRegistration(validated.user);
  res.json(result);
});

webappRouter.post("/submit", async (req, res) => {
  const validated = getValidatedUser(req);
  if (!validated) return res.status(401).json({ error: "Invalid Telegram init data" });

  const validationError = validateSubmitBody(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const registration = await submitRegistration(validated.user, toSubmitBody(req.body));
    res.json({ ok: true, id: registration.id });
  } catch (err) {
    if (err instanceof AlreadyRegisteredError) {
      return res.status(409).json({ error: "Already registered" });
    }
    console.error("Failed to submit registration", err);
    res.status(500).json({ error: "Internal error" });
  }
});
