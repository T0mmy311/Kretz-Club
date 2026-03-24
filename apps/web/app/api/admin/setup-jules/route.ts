import { NextResponse } from "next/server";
import { prisma } from "@kretz/db";

// One-time setup endpoint to make Jules admin
// Call this after Jules creates his account
export async function POST(request: Request) {
  try {
    const { email, secret } = await request.json();

    // Simple secret to prevent unauthorized access
    if (secret !== "kretz-admin-setup-2024") {
      return NextResponse.json({ error: "Non autoris\u00e9" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { email },
    });

    if (!member) {
      return NextResponse.json({ error: "Membre introuvable. Jules doit d'abord cr\u00e9er son compte." }, { status: 404 });
    }

    await prisma.member.update({
      where: { id: member.id },
      data: { isAdmin: true },
    });

    return NextResponse.json({
      success: true,
      message: `${member.firstName} ${member.lastName} est maintenant admin.`
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
