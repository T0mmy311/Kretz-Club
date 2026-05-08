"use client";

import Link from "next/link";
import { Download, FileText, Eye, Loader2, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function FacturesPage() {
  const { data: invoices, isLoading } = trpc.invoice.list.useQuery();
  const items = invoices ?? [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatAmount = (amount: any) => {
    return Number(amount).toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
  };

  const getStatusBadge = (paidAt: string | null | undefined) => {
    if (paidAt) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-medium text-green-400">
          {"Pay\u00e9e"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-[11px] font-medium text-yellow-400">
        En attente
      </span>
    );
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Factures</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Retrouvez toutes vos factures
          </p>
        </div>
        <a
          href="/api/export/my-events"
          className="inline-flex items-center gap-2 self-start rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12.5px] font-medium text-foreground/80 hover:border-white/[0.12] hover:bg-white/[0.06] transition-colors sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          {"Exporter mes événements (CSV)"}
        </a>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/60" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center text-muted-foreground/60">
          <FileText className="h-10 w-10 opacity-20" />
          <p className="mt-4 text-[14px]">Aucune facture</p>
          <p className="mt-1 text-[12px] text-muted-foreground/40">{"Vos factures appara\u00eetront ici apr\u00e8s un paiement"}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    {"Num\u00e9ro"}
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((invoice: any) => (
                  <tr key={invoice.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium text-foreground/80">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {formatDate(invoice.issuedAt)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {invoice.event ? (
                        <Link
                          href={`/evenements/${invoice.event.id}`}
                          className="inline-flex items-center gap-1.5 text-foreground/80 hover:text-foreground hover:underline"
                        >
                          <Calendar className="h-3 w-3" />
                          {invoice.description ?? invoice.event.title}
                        </Link>
                      ) : (
                        invoice.description ?? "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(invoice.paidAt)}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-medium text-foreground/80">
                      {formatAmount(invoice.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/invoice/${invoice.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Voir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {items.map((invoice: any) => (
              <div key={invoice.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-foreground/80">{invoice.invoiceNumber}</span>
                  {getStatusBadge(invoice.paidAt)}
                </div>
                {invoice.event ? (
                  <Link
                    href={`/evenements/${invoice.event.id}`}
                    className="inline-flex items-center gap-1.5 text-[13px] text-foreground/80 hover:underline"
                  >
                    <Calendar className="h-3 w-3" />
                    {invoice.description ?? invoice.event.title}
                  </Link>
                ) : (
                  <p className="text-[13px] text-muted-foreground">{invoice.description ?? "-"}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground/60">{formatDate(invoice.issuedAt)}</span>
                  <span className="text-[14px] font-semibold text-foreground/80">{formatAmount(invoice.totalAmount)}</span>
                </div>
                <a
                  href={`/api/invoice/${invoice.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-md bg-muted/50 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  {"Voir la facture"}
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
