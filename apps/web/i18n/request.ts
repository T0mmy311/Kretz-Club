import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const SUPPORTED = ["fr", "en"] as const;
type Locale = (typeof SUPPORTED)[number];

function isLocale(value: string | undefined): value is Locale {
  return !!value && (SUPPORTED as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get("locale")?.value;
  const locale: Locale = isLocale(cookieValue) ? cookieValue : "fr";

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    // Fallback to French if locale file is missing
    messages = (await import(`../messages/fr.json`)).default;
  }

  return {
    locale,
    messages,
  };
});
