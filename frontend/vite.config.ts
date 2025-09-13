import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API requests to the backend during development
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        // optional: keep the path as-is so /api/hello -> http://localhost:5000/api/hello
        rewrite: (path) => path,
      },
    },
  },
});
