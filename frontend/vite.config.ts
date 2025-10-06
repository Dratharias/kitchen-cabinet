import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.MEALTICKET_FRONTEND_PORT) || 3000,
    proxy: {
      "/api": {
        target:
          process.env.VITE_API_URL ||
          `http://localhost:${process.env.VITE_API_PORT}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: "esnext",
  },
});
