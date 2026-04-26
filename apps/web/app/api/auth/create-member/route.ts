import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@kretz/db";

export async function POST(request: Request) {
  try {
    const { firstName, lastName } = await request.json();

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Derive identity from authenticated session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const existing = await prisma.member.findUnique({
      where: { supabaseAuthId: user.id },
    });

    if (existing) {
      // Auto-join all channels for safety (idempotent)
      const channels = await prisma.channel.findMany({ select: { id: true } });
      if (channels.length > 0) {
        await prisma.channelMember.createMany({
          data: channels.map((c) => ({ channelId: c.id, memberId: existing.id })),
          skipDuplicates: true,
        });
      }
      return NextResponse.json({ member: existing });
    }

    const member = await prisma.member.create({
      data: {
        supabaseAuthId: user.id,
        email: user.email,
        firstName,
        lastName,
      },
    });

    // Auto-join all channels
    const channels = await prisma.channel.findMany({ select: { id: true } });
    if (channels.length > 0) {
      await prisma.channelMember.createMany({
        data: channels.map((c) => ({ channelId: c.id, memberId: member.id })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du membre" },
      { status: 500 }
    );
  }
}
