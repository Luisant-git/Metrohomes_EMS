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
    registerType: "prompt",
    injectRegister: false,
    manifest: {
      name: "Metrohomes",
      short_name: "Metrohomes",
      description: "Metrohomes Progressive Web App",
      display: "standalone",
      start_url: "/",
      scope: "/",
      icons: [
        {
          src: "/metrohomes-icon.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/metrohomes-icon.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      navigateFallback: '/index.html',
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
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