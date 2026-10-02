import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workbench articles are read from content/workbench/*.md when /workbench is requested, so ship them with it.
  outputFileTracingIncludes: {
    "/workbench": ["./content/workbench/**/*"],
    "/workbench/*": ["./content/workbench/**/*"],
  },
};

export default nextConfig;
