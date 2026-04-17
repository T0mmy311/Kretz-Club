"use client";

import { Download, FileText, Eye, Loader2 } from "lucide-react";
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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Factures</h2>
        <p className="mt-1 text-[13px] text-white/40">
          Retrouvez toutes vos factures
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center text-white/30">
          <FileText className="h-10 w-10 opacity-20" />
          <p className="mt-4 text-[14px]">Aucune facture</p>
          <p className="mt-1 text-[12px] text-white/20">{"Vos factures appara\u00eetront ici apr\u00e8s un paiement"}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-white/[0.06]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                    {"Num\u00e9ro"}
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-white/30">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-white/30">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-white/30">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((invoice: any) => (
                  <tr key={invoice.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium text-white/80">{invoice.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/40">
                      {formatDate(invoice.issuedAt)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white/60">
                      {invoice.description ?? invoice.event?.title ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(invoice.paidAt)}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-medium text-white/80">
                      {formatAmount(invoice.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/invoice/${invoice.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/60 hover:bg-white/[0.1] hover:text-white transition-colors"
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
              <div key={invoice.id} className="rounded-lg border border-white/[0.06] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-white/80">{invoice.invoiceNumber}</span>
                  {getStatusBadge(invoice.paidAt)}
                </div>
                <p className="text-[13px] text-white/50">{invoice.description ?? invoice.event?.title ?? "-"}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/30">{formatDate(invoice.issuedAt)}</span>
                  <span className="text-[14px] font-semibold text-white/80">{formatAmount(invoice.totalAmount)}</span>
                </div>
                <a
                  href={`/api/invoice/${invoice.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-md bg-white/[0.06] py-2 text-[12px] font-medium text-white/60 hover:bg-white/[0.1] transition-colors"
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
