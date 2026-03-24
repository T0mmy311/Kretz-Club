import { NextResponse } from "next/server";
import { prisma } from "@kretz/db";
import { generateIcsEvent } from "@kretz/shared/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      location: true,
      startsAt: true,
      endsAt: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const ics = generateIcsEvent({
    title: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    startsAt: event.startsAt,
    endsAt: event.endsAt ?? undefined,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, "-")}.ics"`,
    },
  });
}
