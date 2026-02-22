export interface AppConfig {
  generation: {
    language: string;
    template: string;
    max_turns: number;
    output_dir: string;
    web_research: {
      enabled: boolean;
      depth: "light" | "moderate" | "extensive";
    };
  };
  format: {
    outputs: string[];
    style: string;
    custom_css: string;
  };
  delivery: {
    default: string;
    channels: {
      email?: {
        smtp_host: string;
        smtp_port: number;
        from: string;
        to: string;
        // Password via BOOKFACTORY_EMAIL_PASSWORD env var
      };
      telegram?: {
        bot_token_env: string;
        chat_id: string;
      };
    };
  };
  schedule: {
    enabled: boolean;
    frequency: string;
  };
}

export function defaultConfig(): AppConfig {
  return {
    generation: {
      language: "en",
      template: "comprehensive",
      max_turns: 50,
      output_dir: "",
      web_research: {
        enabled: true,
        depth: "extensive",
      },
    },
    format: {
      outputs: ["html"],
      style: "default",
      custom_css: "",
    },
    delivery: {
      default: "local",
      channels: {},
    },
    schedule: {
      enabled: false,
      frequency: "0 14 * * *",
    },
  };
}
