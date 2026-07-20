import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: "autoUpdate",
    injectRegister: false,
    manifest: {
      name: "Metrohomes",
      short_name: "Metrohomes",
      description: "Metrohomes Progressive Web App",
      theme_color: "#2563EB",
      background_color: "#FFFFFF",
      display: "standalone",
      start_url: "/",
      scope: "/",
      icons: [
        {
          src: "/metrohomes-icon.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/metrohomes-icon.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/metrohomes-icon.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "gstatic-fonts-cache",
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
      navigateFallback: null,
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },
    devOptions: {
      enabled: false,
    },
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
