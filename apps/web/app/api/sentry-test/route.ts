import { NextResponse } from "next/server";

// Temporary test endpoint to verify Sentry is capturing errors
// Visit /api/sentry-test - it will throw an error that Sentry should capture
export async function GET() {
  throw new Error("Sentry test error from Kretz Club - " + new Date().toISOString());
}
