import { NextResponse } from "next/server";
import { prisma } from "@kretz/db";

export async function POST(request: Request) {
  try {
    const { supabaseAuthId, email, firstName, lastName } = await request.json();

    if (!supabaseAuthId || !email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const existing = await prisma.member.findUnique({
      where: { supabaseAuthId },
    });

    if (existing) {
      return NextResponse.json({ member: existing });
    }

    const member = await prisma.member.create({
      data: {
        supabaseAuthId,
        email,
        firstName,
        lastName,
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du membre" },
      { status: 500 }
    );
  }
}
