import { NextResponse } from "next/server";
import { prisma } from "@kretz/db";
import { sendEmail } from "@/lib/email/sender";
import { weeklyDigestHtml } from "@/lib/email/templates/weekly-digest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Auth check via header `Authorization: Bearer ${CRON_SECRET}`
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kretzclub.com";
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Fetch the global lists once (same for every member)
    const newInvestmentsRaw = await prisma.investment.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ["open", "funding"] },
      },
      select: {
        id: true,
        title: true,
        location: true,
        targetAmount: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const newInvestments = newInvestmentsRaw.map((i) => ({
      id: i.id,
      title: i.title,
      location: i.location,
      targetAmount: Number(i.targetAmount ?? 0),
    }));

    const upcomingEventsRaw = await prisma.event.findMany({
      where: {
        startsAt: { gte: now, lte: fourteenDaysFromNow },
        status: "published",
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        location: true,
      },
      orderBy: { startsAt: "asc" },
    });

    const upcomingEvents = upcomingEventsRaw.map((e) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt,
      location: e.location,
    }));

    // Find all active members
    const members = await prisma.member.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    for (const member of members) {
      try {
        if (!member.email) {
          skipped++;
          continue;
        }

        // Count new messages in their channels since last 7 days
        const channelMemberships = await prisma.channelMember.findMany({
          where: { memberId: member.id },
          select: { channelId: true },
        });
        const channelIds = channelMemberships.map((c) => c.channelId);

        const newMessages = channelIds.length
          ? await prisma.message.count({
              where: {
                channelId: { in: channelIds },
                createdAt: { gte: sevenDaysAgo },
                authorId: { not: member.id },
              },
            })
          : 0;

        // Skip members with no relevant content
        if (newMessages === 0 && newInvestments.length === 0 && upcomingEvents.length === 0) {
          skipped++;
          continue;
        }

        const html = weeklyDigestHtml({
          memberFirstName: member.firstName,
          newMessages,
          newInvestments,
          upcomingEvents,
          appUrl,
        });

        await sendEmail({
          to: member.email,
          subject: "Kretz Club — votre récap de la semaine",
          html,
        });

        sent++;
      } catch (err) {
        console.error(`[weekly-digest] error for member ${member.id}:`, err);
        errors++;
      }
    }

    return NextResponse.json({ sent, skipped, errors });
  } catch (err) {
    console.error("[weekly-digest] fatal error:", err);
    return NextResponse.json(
      { error: "Internal server error", sent, skipped, errors },
      { status: 500 }
    );
  }
}
