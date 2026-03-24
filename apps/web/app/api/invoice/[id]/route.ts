import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { prisma } from "@kretz/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autoris\u00e9" }, { status: 401 });
    }

    const { id } = await params;

    const member = await prisma.member.findUnique({
      where: { supabaseAuthId: user.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id, memberId: member.id },
      include: {
        event: true,
        member: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    }

    // Generate PDF as HTML -> rendered server-side
    const html = generateInvoiceHTML(invoice);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Invoice error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function generateInvoiceHTML(invoice: any) {
  const date = new Date(invoice.issuedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const amount = Number(invoice.totalAmount).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  const taxAmount = Number(invoice.taxAmount || 0).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture ${invoice.invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #e5e5e5; }
    .logo { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    .logo span { color: #b8860b; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 20px; font-weight: 600; }
    .invoice-date { color: #666; margin-top: 4px; font-size: 14px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-top: 8px; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .party { flex: 1; }
    .party-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #999; margin-bottom: 8px; }
    .party-name { font-size: 16px; font-weight: 600; }
    .party-detail { font-size: 13px; color: #666; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #999; border-bottom: 1px solid #e5e5e5; }
    th:last-child { text-align: right; }
    td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f0f0f0; }
    td:last-child { text-align: right; font-weight: 500; }
    .totals { margin-left: auto; width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .total-row.final { border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 700; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #999; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
    .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #1a1a1a; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; }
    .print-btn:hover { background: #333; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Imprimer / Sauvegarder PDF</button>

  <div class="header">
    <div>
      <div class="logo">Kretz <span>Club</span></div>
      <div class="party-detail" style="margin-top: 8px;">
        Kretz & Partners<br>
        Paris, France
      </div>
    </div>
    <div class="invoice-info">
      <div class="invoice-number">${invoice.invoiceNumber}</div>
      <div class="invoice-date">${date}</div>
      <div class="status ${invoice.status === 'paid' ? 'status-paid' : 'status-pending'}">
        ${invoice.status === 'paid' ? 'Pay\u00e9e' : 'En attente'}
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">\u00c9metteur</div>
      <div class="party-name">Kretz Club</div>
      <div class="party-detail">Kretz & Partners</div>
    </div>
    <div class="party" style="text-align: right;">
      <div class="party-label">Destinataire</div>
      <div class="party-name">${invoice.member.firstName} ${invoice.member.lastName}</div>
      <div class="party-detail">${invoice.member.email}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${invoice.description || invoice.event?.title || 'Kretz Club'}</td>
        <td>${amount}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Sous-total</span>
      <span>${amount}</span>
    </div>
    <div class="total-row">
      <span>TVA</span>
      <span>${taxAmount}</span>
    </div>
    <div class="total-row final">
      <span>Total TTC</span>
      <span>${amount}</span>
    </div>
  </div>

  <div class="footer">
    <p>Kretz Club &mdash; Kretz & Partners</p>
    <p style="margin-top: 4px;">Cette facture a \u00e9t\u00e9 g\u00e9n\u00e9r\u00e9e automatiquement.</p>
  </div>
</body>
</html>`;
}
