import { NextResponse } from "next/server";
import { prisma } from "@kretz/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(
      getRateLimitKey(request, "validate-invite"),
      10,
      60 * 1000
    );
    if (!rateLimit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { valid: false, error: "Trop de requêtes, veuillez patienter" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Code requis" },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { code },
    });

    if (!invitation) {
      return NextResponse.json({
        valid: false,
        error: "Code invalide ou expiré",
      });
    }

    if (invitation.usedAt) {
      return NextResponse.json({
        valid: false,
        error: "Code invalide ou expiré",
      });
    }

    if (new Date(invitation.expiresAt) <= new Date()) {
      return NextResponse.json({
        valid: false,
        error: "Code invalide ou expiré",
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Validate invite error:", error);
    return NextResponse.json(
      { valid: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
