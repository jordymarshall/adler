import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { adlerApi } from "./server/api.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (
      /^(ADLER_|PUBLIC_URL$|PORT$|GEMINI_|OPENAI_|ANTHROPIC_|TWILIO_|GOOGLE_)/.test(
        key,
      ) &&
      !process.env[key]
    )
      process.env[key] = value;
  }
  return {
    plugins: [react(), adlerApi()],
    server: {
      fs: {
        deny: [
          ".env",
          ".env.*",
          "*.{crt,pem}",
          "**/.git/**",
          "**/.context/**",
          "**/.data/**",
        ],
      },
    },
  };
});
