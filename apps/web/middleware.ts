import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = ["/connexion", "/inscription", "/verification", "/api/auth", "/api/trpc"];

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // In dev, allow bypass via ?bypass=1 query param
  const bypassAuth =
    process.env.NODE_ENV === "development" &&
    request.nextUrl.searchParams.get("bypass") === "1";

  // Redirect unauthenticated users to /connexion
  if (!user && !isPublicPath && !bypassAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from /connexion
  if (user && pathname === "/connexion") {
    const url = request.nextUrl.clone();
    url.pathname = "/messagerie";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
