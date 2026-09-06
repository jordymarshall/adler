if (!process.env.ADLER_BACKEND_URL)
  throw new Error(
    "Set ADLER_BACKEND_URL to the persistent Adler backend's HTTPS origin before deploying.",
  );
const backend = new URL(process.env.ADLER_BACKEND_URL);
if (
  backend.protocol !== "https:" ||
  backend.username ||
  backend.password ||
  backend.pathname !== "/" ||
  backend.search ||
  backend.hash
)
  throw new Error(
    "ADLER_BACKEND_URL must be an HTTPS origin without credentials, a path, or a query.",
  );

export default {
  framework: "vite",
  buildCommand: "npm run build",
  outputDirectory: "dist",
  rewrites: [
    { source: "/api/:path*", destination: `${backend.origin}/api/:path*` },
    { source: "/mcp", destination: `${backend.origin}/mcp` },
    { source: "/(.*)", destination: "/index.html" },
  ],
  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "same-origin" },
      ],
    },
    ...["/api/:path*", "/mcp"].map((source) => ({
      source,
      headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "x-vercel-enable-rewrite-caching", value: "0" },
      ],
    })),
  ],
};
