import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { createRuntime } from "./api.ts";
const runtime = createRuntime(),
  root = resolve("dist");
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".json": "application/json",
};
const server = createServer((req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
  void runtime.handle(req, res, () => {
    void (async () => {
      try {
        if (req.method !== "GET" && req.method !== "HEAD") {
          res.writeHead(405);
          res.end();
          return;
        }
        const path = decodeURIComponent(
          new URL(req.url ?? "/", "http://localhost").pathname,
        );
        if (path.split("/").some((p) => p.startsWith("."))) {
          res.writeHead(404);
          res.end();
          return;
        }
        let file = resolve(root, "." + path);
        if (file !== root && !file.startsWith(root + sep)) {
          res.writeHead(403);
          res.end();
          return;
        }
        try {
          if (!(await stat(file)).isFile()) file = resolve(root, "index.html");
        } catch {
          if (extname(file)) {
            res.writeHead(404);
            res.end();
            return;
          }
          file = resolve(root, "index.html");
        }
        const content = await readFile(file);
        res.writeHead(200, {
          "Content-Type": types[extname(file)] ?? "application/octet-stream",
          "Cache-Control": file.includes("/assets/")
            ? "public,max-age=31536000,immutable"
            : "no-cache",
        });
        res.end(req.method === "HEAD" ? undefined : content);
      } catch {
        res.writeHead(500);
        res.end("Build the app before starting the server.");
      }
    })();
  });
});
server.requestTimeout = 90000;
server.headersTimeout = 20000;
server.listen(Number(process.env.PORT ?? 8080), "0.0.0.0", () => {
  runtime.start();
  console.log(`Adler server listening on port ${process.env.PORT ?? 8080}`);
});
let closing = false;
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    runtime.channels.stop();
    runtime.planner.stop();
    server.close(() => {
      runtime.db.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 20000).unref();
  });
