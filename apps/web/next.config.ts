import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kretz/api", "@kretz/db", "@kretz/shared", "@kretz/payments"],
};

export default nextConfig;
