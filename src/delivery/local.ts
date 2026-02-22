import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { log } from "../utils/logger.js";
import type { DeliveryPlugin, DeliveryPayload } from "./types.js";

export class LocalDelivery implements DeliveryPlugin {
  name = "local";

  isConfigured(): boolean {
    return true; // always available
  }

  async deliver(payload: DeliveryPayload): Promise<boolean> {
    log.success(`Book saved locally: ${payload.filePath}`);
    return true;
  }
}
