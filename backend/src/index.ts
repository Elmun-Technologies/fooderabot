import { bot } from "./bot/bot";
import { startFollowUpScheduler } from "./bot/followups";
import { createServer } from "./api/server";
import { config } from "./config";

const skipBot = process.env.SKIP_BOT === "1" || process.env.SKIP_BOT === "true";

async function main() {
  const app = createServer();
  app.listen(config.port, () => {
    console.log(`API server listening on port ${config.port}`);
  });

  if (skipBot) {
    console.log("SKIP_BOT is set — Telegram bot and follow-up scheduler are disabled");
  } else {
    await bot.launch();
    console.log("Telegram bot started");

    startFollowUpScheduler();
    console.log("Follow-up scheduler started");
  }

  // With SKIP_BOT the bot was never launched, so bot.stop() would throw.
  process.once("SIGINT", () => {
    if (skipBot) return process.exit(0);
    bot.stop("SIGINT");
  });
  process.once("SIGTERM", () => {
    if (skipBot) return process.exit(0);
    bot.stop("SIGTERM");
  });
}

main().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});
