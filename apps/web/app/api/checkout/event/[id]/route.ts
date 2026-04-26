import { NextResponse } from "next/server";
import { prisma } from "@kretz/db";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { supabaseAuthId: user.id },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Membre introuvable" },
        { status: 404 }
      );
    }

    // 2. Stripe configured?
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        {
          error:
            "Le paiement en ligne n'est pas encore disponible. Veuillez réessayer plus tard.",
        },
        { status: 503 }
      );
    }

    // 3. Load event
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    if (event.status === "cancelled") {
      return NextResponse.json(
        { error: "Cet événement est annulé" },
        { status: 400 }
      );
    }

    if (event.startsAt < new Date()) {
      return NextResponse.json(
        { error: "Cet événement est passé" },
        { status: 400 }
      );
    }

    if (
      event.maxAttendees !== null &&
      event._count.registrations >= event.maxAttendees
    ) {
      return NextResponse.json(
        { error: "Cet événement est complet" },
        { status: 400 }
      );
    }

    const priceEuros = Number(event.price);
    if (!Number.isFinite(priceEuros) || priceEuros <= 0) {
      return NextResponse.json(
        { error: "Cet événement est gratuit, utilisez l'inscription directe." },
        { status: 400 }
      );
    }

    // 4. Existing registration?
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_memberId: { eventId: event.id, memberId: member.id },
      },
    });

    if (existing && existing.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit à cet événement" },
        { status: 409 }
      );
    }

    // 5. Build the Checkout session
    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: member.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(priceEuros * 100),
            product_data: {
              name: event.title,
              description: event.description ?? undefined,
            },
          },
        },
      ],
      metadata: {
        eventId: event.id,
        memberId: member.id,
      },
      success_url: `${origin}/evenements/${event.id}?payment=success`,
      cancel_url: `${origin}/evenements/${event.id}?payment=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Impossible de créer la session de paiement" },
        { status: 500 }
      );
    }

    // 6. Upsert pending registration linked to the session
    if (existing) {
      await prisma.eventRegistration.update({
        where: { id: existing.id },
        data: {
          paymentId: session.id,
          paymentStatus: "pending",
        },
      });
    } else {
      await prisma.eventRegistration.create({
        data: {
          eventId: event.id,
          memberId: member.id,
          paymentId: session.id,
          paymentStatus: "pending",
        },
      });
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
