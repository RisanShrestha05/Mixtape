import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const logDirectory = path.join(projectRoot, ".manus-logs");
const maxLogSize = 1024 * 1024;

function ensureLogDirectory() {
  if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory, { recursive: true });
}

function writeBrowserLogs(source, entries) {
  if (!Array.isArray(entries) || entries.length === 0) return;
  ensureLogDirectory();
  const logPath = path.join(logDirectory, `${source}.log`);
  const lines = entries.map((entry) => `[${new Date().toISOString()}] ${JSON.stringify(entry)}`);
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");
  if (fs.statSync(logPath).size > maxLogSize) {
    const recent = fs.readFileSync(logPath, "utf-8").split("\n").slice(-5000).join("\n");
    fs.writeFileSync(logPath, recent, "utf-8");
  }
}

function manusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") return html;
      return {
        html,
        tags: [{ tag: "script", attrs: { src: "/__manus__/debug-collector.js", defer: true }, injectTo: "head" }],
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (request, response, next) => {
        if (request.method !== "POST") return next();
        let body = "";
        request.on("data", (chunk) => { body += chunk.toString(); });
        request.on("end", () => {
          try {
            const payload = JSON.parse(body || "{}");
            writeBrowserLogs("browserConsole", payload.consoleLogs);
            writeBrowserLogs("networkRequests", payload.networkRequests);
            writeBrowserLogs("sessionReplay", payload.sessionEvents);
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ success: true }));
          } catch (error) {
            response.writeHead(400, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ success: false, error: String(error) }));
          }
        });
      });
    },
  };
}

function manusStorageProxy() {
  return {
    name: "manus-storage-proxy",
    configureServer(server) {
      server.middlewares.use("/manus-storage", async (request, response) => {
        const key = request.url?.replace(/^\//, "");
        if (!key) {
          response.writeHead(400, { "Content-Type": "text/plain" });
          response.end("Missing storage key");
          return;
        }
        const forgeBaseUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
        if (!forgeBaseUrl || !forgeKey) {
          response.writeHead(500, { "Content-Type": "text/plain" });
          response.end("Storage proxy not configured");
          return;
        }
        try {
          const forgeUrl = new URL("v1/storage/presign/get", `${forgeBaseUrl}/`);
          forgeUrl.searchParams.set("path", key);
          const forgeResponse = await fetch(forgeUrl, { headers: { Authorization: `Bearer ${forgeKey}` } });
          if (!forgeResponse.ok) {
            response.writeHead(502, { "Content-Type": "text/plain" });
            response.end("Storage backend error");
            return;
          }
          const { url } = await forgeResponse.json();
          if (!url) throw new Error("Empty signed URL");
          response.writeHead(307, { Location: url, "Cache-Control": "no-store" });
          response.end();
        } catch (error) {
          response.writeHead(502, { "Content-Type": "text/plain" });
          response.end(`Storage proxy error: ${String(error)}`);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), vitePluginManusRuntime(), manusDebugCollector(), manusStorageProxy()],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client", "src"),
      "@shared": path.resolve(projectRoot, "shared"),
      "@assets": path.resolve(projectRoot, "attached_assets"),
    },
  },
  envDir: projectRoot,
  root: path.resolve(projectRoot, "client"),
  build: { outDir: path.resolve(projectRoot, "dist/public"), emptyOutDir: true },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    allowedHosts: [".manuspre.computer", ".manus.computer", ".manus-asia.computer", ".manuscomputer.ai", ".manusvm.computer", "localhost", "127.0.0.1"],
    fs: { strict: true, deny: ["**/.*"] },
  },
});
