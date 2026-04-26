import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@kretz/db";
import { getStripe } from "@/lib/stripe/server";
import { generateInvoiceNumber } from "@kretz/shared/utils";

// Stripe needs the raw request body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (
    !stripe ||
    !webhookSecret ||
    webhookSecret === "whsec_PLACEHOLDER" ||
    webhookSecret.includes("PLACEHOLDER")
  ) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        await handleCheckoutFailed(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }

      default:
        // Ignore other event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const eventId = session.metadata?.eventId;
  const memberId = session.metadata?.memberId;

  if (!eventId || !memberId) {
    console.warn("checkout.session.completed missing metadata", session.id);
    return;
  }

  const [event, registration] = await Promise.all([
    prisma.event.findUnique({ where: { id: eventId } }),
    prisma.eventRegistration.findUnique({
      where: {
        eventId_memberId: { eventId, memberId },
      },
    }),
  ]);

  if (!event) {
    console.warn("checkout.session.completed: event not found", eventId);
    return;
  }

  if (!registration) {
    // Edge case: race / manual deletion. Re-create as paid.
    await prisma.eventRegistration.create({
      data: {
        eventId,
        memberId,
        paymentId: session.id,
        paymentStatus: "paid",
      },
    });
  } else if (registration.paymentStatus !== "paid") {
    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        paymentStatus: "paid",
        paymentId: session.id,
      },
    });
  }

  // Idempotency: don't double-create the invoice for the same Stripe session.
  const existingInvoice = await prisma.invoice.findFirst({
    where: { paymentRef: session.id },
  });

  if (existingInvoice) {
    return;
  }

  const amount = Number(event.price);
  const totalAmount =
    typeof session.amount_total === "number"
      ? session.amount_total / 100
      : amount;

  const year = new Date().getFullYear();
  const invoiceCount = await prisma.invoice.count({
    where: {
      issuedAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(year, invoiceCount + 1),
      memberId,
      eventId,
      amount,
      taxAmount: 0,
      totalAmount,
      description: `Inscription — ${event.title}`,
      paymentRef: session.id,
      paidAt: new Date(),
    },
  });
}

async function handleCheckoutFailed(session: Stripe.Checkout.Session) {
  const eventId = session.metadata?.eventId;
  const memberId = session.metadata?.memberId;

  if (!eventId || !memberId) {
    return;
  }

  const registration = await prisma.eventRegistration.findUnique({
    where: { eventId_memberId: { eventId, memberId } },
  });

  // Only delete pending registrations tied to this session.
  if (
    registration &&
    registration.paymentStatus === "pending" &&
    registration.paymentId === session.id
  ) {
    await prisma.eventRegistration.delete({
      where: { id: registration.id },
    });
  }
}
