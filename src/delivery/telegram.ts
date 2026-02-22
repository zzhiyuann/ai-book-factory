import { execSync } from "node:child_process";
import { log } from "../utils/logger.js";
import type { DeliveryPlugin, DeliveryPayload } from "./types.js";
import { loadConfig } from "../profile/manager.js";

export class TelegramDelivery implements DeliveryPlugin {
  name = "telegram";

  isConfigured(): boolean {
    const config = loadConfig();
    const tg = config.delivery.channels.telegram;
    if (!tg) return false;
    const token = process.env[tg.bot_token_env || "BOOKFACTORY_TELEGRAM_TOKEN"];
    return !!(token && tg.chat_id);
  }

  async deliver(payload: DeliveryPayload): Promise<boolean> {
    const config = loadConfig();
    const tg = config.delivery.channels.telegram;
    if (!tg) {
      log.error("Telegram not configured.");
      return false;
    }

    const token = process.env[tg.bot_token_env || "BOOKFACTORY_TELEGRAM_TOKEN"];
    if (!token) {
      log.error(`Set ${tg.bot_token_env || "BOOKFACTORY_TELEGRAM_TOKEN"} environment variable.`);
      return false;
    }

    try {
      const caption = payload.caption || payload.title;
      execSync(
        `curl -s -F chat_id="${tg.chat_id}" -F document=@"${payload.filePath}" -F caption="${caption}" "https://api.telegram.org/bot${token}/sendDocument"`,
        { stdio: "ignore", timeout: 30000 }
      );
      log.success(`Sent via Telegram: ${payload.title}`);
      return true;
    } catch (err) {
      log.error("Telegram delivery failed.");
      return false;
    }
  }
}
