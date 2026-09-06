import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Isolated design prototype. The existing app and API keep their own entry point.
export default defineConfig({
  root: "src/prototype-v2",
  cacheDir: "../../node_modules/.vite-v2",
  publicDir: "../../public",
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5200, strictPort: true },
  build: { outDir: "../../dist/v2", emptyOutDir: true },
});
