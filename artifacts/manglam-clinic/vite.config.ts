import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

const port = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || "/";

// Generates public/sw.js AFTER the production build, listing every file that
// actually came out of `dist/public` (JS/CSS bundles with their content hashes,
// icons, manifest, etc). This guarantees the very first successful page load
// eagerly caches the *entire* app, so it works offline immediately afterward —
// instead of only caching whatever happened to be requested before you went
// offline. Each build gets a fresh cache name, so redeploys cleanly replace
// the old offline copy the next time the device is online.
function offlinePrecachePlugin(): Plugin {
  return {
    name: "offline-precache-sw",
    apply: "build",
    closeBundle() {
      const outDir = path.resolve(import.meta.dirname, "dist/public");

      function walk(dir: string, base = ""): string[] {
        let results: string[] = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const rel = base ? `${base}/${entry.name}` : entry.name;
          const abs = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results = results.concat(walk(abs, rel));
          } else if (entry.name !== "sw.js") {
            results.push(`/${rel}`);
          }
        }
        return results;
      }

      const files = walk(outDir);
      const buildId = Date.now().toString(36);
      // Hashed filenames (e.g. /assets/index-abc123.js) change whenever their
      // content changes, so they're safe to serve cache-first forever.
      // Everything else (/, /index.html, /manifest.json, icons) keeps the
      // same URL across deploys, so it's served network-first with a cached
      // fallback, to still pick up updates whenever there's a connection.
      const isHashed = (url: string) => url.startsWith("/assets/");

      const swContent = `// AUTO-GENERATED at build time by vite.config.ts — do not edit by hand.
const CACHE_NAME = "manglam-clinic-${buildId}";
const PRECACHE_URLS = ${JSON.stringify(["/", ...files])};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isHashedAsset(url) {
  return new URL(url).pathname.startsWith("/assets/");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Hashed build assets: cache-first. Their URL only ever changes when their
  // content changes, so a cache hit is always correct and instant offline.
  if (isHashedAsset(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // Everything else (HTML shell, manifest, icons): network-first so you get
  // the latest when online, falling back to the cached copy when offline.
  // Navigation requests (e.g. reloading on a sub-page) fall back to the
  // cached index.html so client-side routing can take over.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(
        () =>
          caches.match(event.request).then((cached) => {
            if (cached) return cached;
            if (event.request.mode === "navigate") {
              return caches.match("/index.html");
            }
            return undefined;
          })
      )
  );
});
`;

      fs.writeFileSync(path.join(outDir, "sw.js"), swContent);
      console.log(`[offline-precache-sw] wrote sw.js precaching ${files.length + 1} files (${CACHE_NAME_LOG(buildId)})`);
      function CACHE_NAME_LOG(id: string) {
        return `manglam-clinic-${id}`;
      }
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    offlinePrecachePlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
