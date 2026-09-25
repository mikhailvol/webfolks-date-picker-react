import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  // The whole library is client-side UI; keep the directive for Next.js App Router.
  banner: { js: '"use client";' },
});
