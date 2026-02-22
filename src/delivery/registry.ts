import type { DeliveryPlugin } from "./types.js";
import { LocalDelivery } from "./local.js";
import { TelegramDelivery } from "./telegram.js";
import { EmailDelivery } from "./email.js";

const plugins: Map<string, DeliveryPlugin> = new Map();

function registerDefaults(): void {
  if (plugins.size > 0) return;
  const defaults = [new LocalDelivery(), new TelegramDelivery(), new EmailDelivery()];
  for (const p of defaults) {
    plugins.set(p.name, p);
  }
}

export function getDeliveryPlugin(name: string): DeliveryPlugin | undefined {
  registerDefaults();
  return plugins.get(name);
}

export function listDeliveryPlugins(): DeliveryPlugin[] {
  registerDefaults();
  return [...plugins.values()];
}

export function registerPlugin(plugin: DeliveryPlugin): void {
  registerDefaults();
  plugins.set(plugin.name, plugin);
}
