import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "../dist"),
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": "http://localhost:4000",
      "/health": "http://localhost:4000"
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
