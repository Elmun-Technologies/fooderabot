import { bot } from "./bot/bot";
import { createServer } from "./api/server";
import { config } from "./config";

async function main() {
  const app = createServer();
  app.listen(config.port, () => {
    console.log(`API server listening on port ${config.port}`);
  });

  await bot.launch();
  console.log("Telegram bot started");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});
