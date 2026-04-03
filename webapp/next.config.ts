import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include the pipeline JSON files in the serverless bundle on Vercel
  outputFileTracingIncludes: {
    "/*": ["../pipeline/model_metadata.json", "../pipeline/metrics.json"],
  },
};

export default nextConfig;
