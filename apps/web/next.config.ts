import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  webpack: (config) => {
    const projectDir = path.dirname(fileURLToPath(import.meta.url));
    const projectNodeModules = path.join(projectDir, "node_modules");

    config.resolve = config.resolve ?? {};
    const existingModules = Array.isArray(config.resolve.modules)
      ? config.resolve.modules
      : [];

    config.resolve.modules = [projectNodeModules, ...existingModules];
    return config;
  },
};

export default nextConfig;
