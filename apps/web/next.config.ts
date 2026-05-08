import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  transpilePackages: ["@kretz/api", "@kretz/db", "@kretz/shared", "@kretz/payments"],
};

const hasSentryConfig =
  !!process.env.SENTRY_DSN &&
  process.env.SENTRY_DSN !== "PLACEHOLDER" &&
  !!process.env.SENTRY_ORG &&
  process.env.SENTRY_ORG !== "PLACEHOLDER" &&
  !!process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_AUTH_TOKEN !== "PLACEHOLDER";

export default hasSentryConfig
  ? withSentryConfig(nextConfig, {
      silent: true,
      tunnelRoute: "/monitoring",
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Don't fail the build if sourcemap upload fails
      errorHandler: () => {
        // Silently ignore Sentry build errors
      },
    })
  : nextConfig;
