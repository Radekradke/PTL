import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  VitePWA({
  registerType: "autoUpdate",
  manifest: {
    name: "PTL - Painel Técnico Lifting",
    short_name: "PTL",
    description: "Sistema interno de chamados da Lifting Electric",
    theme_color: "#073B2A",
    background_color: "#111827",
    display: "standalone",
    start_url: "/",
    scope: "/",
    icons: [
      {
        src: "/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },

}),
})