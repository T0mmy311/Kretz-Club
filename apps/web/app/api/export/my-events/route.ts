import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@kretz/db";

export const dynamic = "force-dynamic";

// CSV escaping per RFC 4180: wrap in quotes if value contains delimiter, quote, CR or LF;
// double any embedded quotes.
function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatPaymentStatus(status: string): string {
  switch (status) {
    case "paid":
      return "Payé";
    case "pending":
      return "En attente";
    case "refunded":
      return "Remboursé";
    case "failed":
      return "Échec";
    case "free":
      return "Gratuit";
    default:
      return status;
  }
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(d: Date): string {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number): string {
  return Number(amount).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { memberId: member.id },
      include: {
        event: {
          select: {
            title: true,
            startsAt: true,
            location: true,
            price: true,
          },
        },
      },
      orderBy: { event: { startsAt: "desc" } },
    });

    const header = [
      "Date",
      "Titre",
      "Lieu",
      "Prix",
      "Statut paiement",
      "Date d'inscription",
    ].join(",");

    const rows = registrations.map((r) =>
      [
        csvEscape(formatDate(r.event.startsAt)),
        csvEscape(r.event.title),
        csvEscape(r.event.location ?? ""),
        csvEscape(formatAmount(Number(r.event.price))),
        csvEscape(formatPaymentStatus(r.paymentStatus)),
        csvEscape(formatDateTime(r.registeredAt)),
      ].join(",")
    );

    // BOM (﻿) prefix so Excel detects UTF-8 correctly.
    const csv = "﻿" + [header, ...rows].join("\r\n") + "\r\n";

    const today = new Date().toISOString().slice(0, 10);
    const filename = `mes-evenements-kretz-club-${today}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export my-events error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
