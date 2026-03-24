"use client";

import { Download, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function FacturesPage() {
  const { data: invoices, isLoading } = trpc.invoice.list.useQuery();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Factures</h2>
        <p className="mt-1 text-muted-foreground">
          Retrouvez toutes vos factures
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Numero
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Montant
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                  Telecharger
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                invoices as Array<{
                  id: string;
                  number: string;
                  date: string;
                  description: string;
                  amount: number;
                  pdfUrl?: string;
                }>
              )?.map((invoice) => (
                <tr key={invoice.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {invoice.number}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {invoice.description}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {invoice.amount.toLocaleString("fr-FR")} EUR
                  </td>
                  <td className="px-4 py-3 text-right">
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
