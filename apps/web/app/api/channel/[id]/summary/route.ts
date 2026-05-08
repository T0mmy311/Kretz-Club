import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@kretz/db";

// In-memory TTL cache (per Lambda instance — acceptable for short-lived 1h cache)
const cache = new Map<string, { data: { summary: string; messageCount: number }; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Ensure the requester is a member (and active) — keeps the route consistent
    // with the rest of the platform.
    const member = await prisma.member.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true, isActive: true },
    });
    if (!member || !member.isActive) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // API key check
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "PLACEHOLDER") {
      return NextResponse.json({ error: "Service IA non configuré" }, { status: 503 });
    }

    // Cache check
    const cached = cache.get(id);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    // Verify channel exists
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (!channel) {
      return NextResponse.json({ error: "Channel introuvable" }, { status: 404 });
    }

    // Fetch last 50 messages, oldest first for the prompt
    const messages = await prisma.message.findMany({
      where: { channelId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { firstName: true, lastName: true } } },
    });

    if (messages.length < 5) {
      return NextResponse.json(
        { error: "Pas assez de messages pour générer un résumé (minimum 5)" },
        { status: 400 }
      );
    }

    const conversation = messages
      .reverse()
      .map((m) => `[${m.author.firstName} ${m.author.lastName}]: ${m.content}`)
      .join("\n");

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Résume cette conversation en français en 3-5 points clés essentiels. Sois concis et professionnel. Format: liste à puces (• ). Maximum 200 mots.\n\nConversation:\n${conversation}`,
        },
      ],
    });

    const summary =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    const result = { summary, messageCount: messages.length };
    cache.set(id, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Channel summary error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du résumé" },
      { status: 500 }
    );
  }
}
