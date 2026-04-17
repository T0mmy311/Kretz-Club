import { NextResponse } from "next/server";
import { prisma } from "@kretz/db";

export async function POST(request: Request) {
  try {
    const { code, memberId } = await request.json();

    if (!code || !memberId) {
      return NextResponse.json(
        { error: "Code et memberId requis" },
        { status: 400 }
      );
    }

    // Look up the member by their Supabase auth ID
    const member = await prisma.member.findUnique({
      where: { supabaseAuthId: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre introuvable" },
        { status: 404 }
      );
    }

    // Mark the invitation as used
    await prisma.invitation.update({
      where: { code },
      data: {
        usedById: member.id,
        usedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Use invite error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
