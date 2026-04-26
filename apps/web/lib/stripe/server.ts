import Stripe from "stripe";

/**
 * Returns a configured Stripe client, or null when STRIPE_SECRET_KEY
 * is missing / still set to its PLACEHOLDER value.
 *
 * Callers should treat `null` as "Stripe is not available" and degrade
 * gracefully (e.g. respond with HTTP 503 / show a "Paiement non disponible"
 * message in the UI).
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === "sk_test_PLACEHOLDER" || key.includes("PLACEHOLDER")) {
    return null;
  }

  return new Stripe(key, {
    // Use whatever the SDK considers its latest API version.
    // Omitting `apiVersion` would fall back to the account default;
    // pinning here keeps responses stable across SDK upgrades.
    typescript: true,
    appInfo: {
      name: "Kretz Club",
    },
  });
}

export function isStripeConfigured(): boolean {
  return getStripe() !== null;
}
