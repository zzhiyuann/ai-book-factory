import { log } from "../utils/logger.js";
import type { DeliveryPlugin, DeliveryPayload } from "./types.js";
import { loadConfig } from "../profile/manager.js";

export class EmailDelivery implements DeliveryPlugin {
  name = "email";

  isConfigured(): boolean {
    const config = loadConfig();
    const email = config.delivery.channels.email;
    if (!email) return false;
    const password = process.env.BOOKFACTORY_EMAIL_PASSWORD;
    return !!(email.smtp_host && email.from && email.to && password);
  }

  async deliver(payload: DeliveryPayload): Promise<boolean> {
    const config = loadConfig();
    const email = config.delivery.channels.email;
    if (!email) {
      log.error("Email not configured.");
      return false;
    }

    try {
      // Dynamic import to avoid requiring nodemailer if not installed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = await (Function('return import("nodemailer")')() as Promise<any>);
      const password = process.env.BOOKFACTORY_EMAIL_PASSWORD;

      const createTransport = nodemailer.default?.createTransport || nodemailer.createTransport;
      const transporter = createTransport({
        host: email.smtp_host,
        port: email.smtp_port || 587,
        secure: email.smtp_port === 465,
        auth: { user: email.from, pass: password },
      });

      await transporter.sendMail({
        from: email.from,
        to: email.to,
        subject: `New Book: ${payload.title}`,
        text: payload.caption || `New book: ${payload.title}`,
        attachments: [{ path: payload.filePath }],
      });

      log.success(`Sent via email to ${email.to}: ${payload.title}`);
      return true;
    } catch (err) {
      log.error(`Email delivery failed: ${err}`);
      return false;
    }
  }
}
