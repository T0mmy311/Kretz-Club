export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(...args: any[]) {
  const Sentry = await import("@sentry/nextjs");
  // @ts-expect-error - forwarding variadic args to Sentry
  return Sentry.captureRequestError(...args);
}
