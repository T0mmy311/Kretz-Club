import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@kretz/api";
import { createClient } from "@/lib/supabase/server";

const handler = async (req: Request) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ supabaseUserId: user?.id ?? null }),
  });
};

export { handler as GET, handler as POST };
