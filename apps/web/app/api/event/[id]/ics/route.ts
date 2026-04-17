import { NextResponse } from "next/server";
import { prisma } from "@kretz/db";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "\u00c9v\u00e9nement introuvable" }, { status: 404 });
    }

    const startDate = formatICSDate(new Date(event.startsAt));
    const endDate = event.endsAt
      ? formatICSDate(new Date(event.endsAt))
      : formatICSDate(new Date(new Date(event.startsAt).getTime() + 2 * 60 * 60 * 1000)); // +2h default

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Kretz Club//Events//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${event.id}@kretzclub.com`,
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${escapeICS(event.title)}`,
      event.description ? `DESCRIPTION:${escapeICS(event.description)}` : "",
      event.location ? `LOCATION:${escapeICS(event.location)}` : "",
      event.address ? `GEO:${escapeICS(event.address)}` : "",
      `ORGANIZER;CN=Kretz Club:mailto:contact@kretzclub.com`,
      `STATUS:CONFIRMED`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slugify(event.title)}.ics"`,
      },
    });
  } catch (error) {
    console.error("ICS error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
