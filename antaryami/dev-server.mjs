// Local dev server that mirrors the Vercel routing: static files + /api/predict.
// Run: node dev-server.mjs  (binds 0.0.0.0 so the preview proxy can reach it)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import handler from "./api/predict.js";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT || 3000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/predict") {
    return handler(req, res);
  }

  // Reject traversal before touching the filesystem.
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const target = join(ROOT, rel === "/" || rel === "\\" ? "index.html" : rel);

  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const body = await readFile(target);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(target)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`antaryami dev server on http://0.0.0.0:${PORT}`);
});
