import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Turbo configuration removed - it was causing bundler errors
  // If you need Turbopack config, use the new format:
  // turbopack: { ... }

  // Set the correct workspace root to avoid multiple lockfile warnings
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
