import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { adlerApi } from "./server/api.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of [
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_MODEL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REDIRECT_URI",
  ]) {
    if (!process.env[key] && env[key]) process.env[key] = env[key];
  }
  return {
    plugins: [react(), adlerApi()],
    server: {
      fs: {
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.context/**"],
      },
    },
  };
});
