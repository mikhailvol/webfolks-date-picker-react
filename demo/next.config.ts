import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The demo is fully static; export it so it can be hosted anywhere (Vercel, GitHub Pages, S3).
  output: "export",
};

export default nextConfig;
