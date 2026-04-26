import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@kretz/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(
      getRateLimitKey(request, "use-invite"),
      5,
      60 * 1000
    );
    if (!rateLimit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Trop de requêtes, veuillez patienter" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Code requis" },
        { status: 400 }
      );
    }

    // Derive identity from authenticated session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Look up the member by their Supabase auth ID
    const member = await prisma.member.findUnique({
      where: { supabaseAuthId: user.id },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre introuvable" },
        { status: 404 }
      );
    }

    // Mark the invitation as used (only if not already used)
    const invitation = await prisma.invitation.findUnique({ where: { code } });
    if (!invitation) {
      return NextResponse.json(
        { error: "Code invalide" },
        { status: 404 }
      );
    }

    if (!invitation.usedAt) {
      await prisma.invitation.update({
        where: { code },
        data: {
          usedById: member.id,
          usedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Use invite error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
