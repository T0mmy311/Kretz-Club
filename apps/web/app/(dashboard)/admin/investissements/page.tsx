"use client";

import { useState } from "react";
import { TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type Status = "draft" | "open" | "funding" | "funded" | "closed" | "cancelled";

type FormState = {
  id?: string;
  title: string;
  description: string;
  location: string;
  targetAmount: string;
  minimumTicket: string;
  status: Status;
  deckUrl: string;
  coverImageUrl: string;
  latitude: string;
  longitude: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  location: "",
  targetAmount: "",
  minimumTicket: "",
  status: "draft",
  deckUrl: "",
  coverImageUrl: "",
  latitude: "",
  longitude: "",
};

const STATUS_LABELS: Record<Status, string> = {
  draft: "Brouillon",
  open: "Ouvert",
  funding: "En levée",
  funded: "Financé",
  closed: "Fermé",
  cancelled: "Annulé",
};

const STATUS_TONES: Record<Status, string> = {
  draft: "bg-muted/40 text-muted-foreground",
  open: "bg-emerald-500/10 text-emerald-400",
  funding: "bg-blue-500/10 text-blue-400",
  funded: "bg-violet-500/10 text-violet-400",
  closed: "bg-muted/40 text-muted-foreground",
  cancelled: "bg-red-500/10 text-red-400",
};

export default function AdminInvestmentsPage() {
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.listInvestments.useQuery();

  const createMutation = trpc.admin.createInvestment.useMutation({
    onSuccess: () => {
      utils.admin.listInvestments.invalidate();
      utils.admin.stats.invalidate();
      utils.audit.list.invalidate();
      toast.success("Investissement créé");
      closeForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.admin.updateInvestment.useMutation({
    onSuccess: () => {
      utils.admin.listInvestments.invalidate();
      utils.audit.list.invalidate();
      toast.success("Investissement mis à jour");
      closeForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteInvestment.useMutation({
    onSuccess: () => {
      utils.admin.listInvestments.invalidate();
      utils.admin.stats.invalidate();
      utils.audit.list.invalidate();
      toast.success("Investissement supprimé");
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  const openCreate = () => {
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (inv: any) => {
    setForm({
      id: inv.id,
      title: inv.title ?? "",
      description: inv.description ?? "",
      location: inv.location ?? "",
      targetAmount: inv.targetAmount ? String(inv.targetAmount) : "",
      minimumTicket: inv.minimumTicket ? String(inv.minimumTicket) : "",
      status: (inv.status ?? "draft") as Status,
      deckUrl: inv.deckUrl ?? "",
      coverImageUrl: inv.coverImageUrl ?? "",
      latitude: inv.latitude !== null && inv.latitude !== undefined ? String(inv.latitude) : "",
      longitude:
        inv.longitude !== null && inv.longitude !== undefined ? String(inv.longitude) : "",
    });
    setOpenForm(true);
  };

  const closeForm = () => {
    setOpenForm(false);
    setForm(emptyForm);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      targetAmount: form.targetAmount ? Number(form.targetAmount) : null,
      minimumTicket: form.minimumTicket ? Number(form.minimumTicket) : null,
      status: form.status,
      deckUrl: form.deckUrl.trim() || null,
      coverImageUrl: form.coverImageUrl.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };

    if (form.id) {
      updateMutation.mutate({ id: form.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const fmtAmount = (v: any) => {
    if (v === null || v === undefined) return "-";
    const n = Number(v);
    if (Number.isNaN(n)) return "-";
    return n.toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Investissements
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {items.length} deal(s)
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouveau deal
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Titre
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Localisation
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Statut
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Objectif
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Investisseurs
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted/50" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Aucun investissement pour le moment.
                </td>
              </tr>
            ) : (
              items.map((inv: any) => (
                <tr
                  key={inv.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {inv.title}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {inv.location || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                        STATUS_TONES[inv.status as Status]
                      )}
                    >
                      {STATUS_LABELS[inv.status as Status] ?? inv.status}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {fmtAmount(inv.targetAmount)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {inv._count?.memberInvestments ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(inv)}
                        title="Modifier"
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground/80 hover:bg-muted/30"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDelete({ id: inv.id, title: inv.title })
                        }
                        title="Supprimer"
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {openForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeForm} />
          <form
            onSubmit={submit}
            className="relative my-8 w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-xl"
          >
            <h3 className="text-base font-semibold text-foreground">
              {form.id ? "Modifier le deal" : "Nouveau deal"}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Titre *" colSpan>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="admin-input"
                />
              </Field>
              <Field label="Description" colSpan>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Localisation">
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Statut">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Status })
                  }
                  className="admin-input"
                >
                  {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Montant cible (EUR)">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.targetAmount}
                  onChange={(e) =>
                    setForm({ ...form, targetAmount: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Ticket minimum (EUR)">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.minimumTicket}
                  onChange={(e) =>
                    setForm({ ...form, minimumTicket: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="URL du deck (PDF)" colSpan>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.deckUrl}
                  onChange={(e) =>
                    setForm({ ...form, deckUrl: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="URL image de couverture" colSpan>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.coverImageUrl}
                  onChange={(e) =>
                    setForm({ ...form, coverImageUrl: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Latitude">
                <input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) =>
                    setForm({ ...form, latitude: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) =>
                    setForm({ ...form, longitude: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "..."
                  : form.id
                    ? "Enregistrer"
                    : "Créer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">
              Supprimer cet investissement ?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              "{confirmDelete.title}" sera définitivement supprimé, ainsi que
              tous les intérêts exprimés.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/30"
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  deleteMutation.mutate({ id: confirmDelete.id })
                }
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function Field({
  label,
  colSpan,
  children,
}: {
  label: string;
  colSpan?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={colSpan ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
