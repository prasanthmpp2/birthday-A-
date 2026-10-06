import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages publishes this app alongside the static 2026 site.
  // In local development, Vite continues to serve it from `/`.
  base: process.env.GITHUB_ACTIONS === "true"
    ? (process.env.GITHUB_REPOSITORY?.split("/")[1]?.endsWith(".github.io")
      ? "/2025/"
      : `/${process.env.GITHUB_REPOSITORY?.split("/")[1] ?? ""}/2025/`)
    : "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
