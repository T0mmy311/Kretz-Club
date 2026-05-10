"use client";

import { useState } from "react";
import { Calendar, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";

type FormState = {
  id?: string;
  title: string;
  description: string;
  location: string;
  address: string;
  startsAt: string;
  endsAt: string;
  price: string;
  maxAttendees: string;
  coverImageUrl: string;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  location: "",
  address: "",
  startsAt: "",
  endsAt: "",
  price: "0",
  maxAttendees: "",
  coverImageUrl: "",
};

// Convert local datetime-local input to ISO string
const localToIso = (val: string): string => {
  if (!val) return "";
  const d = new Date(val);
  return d.toISOString();
};

// Convert ISO date to local datetime-local format (YYYY-MM-DDTHH:mm)
const isoToLocal = (iso: string | Date | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
};

export default function AdminEventsPage() {
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.listEvents.useQuery();

  const createMutation = trpc.admin.createEvent.useMutation({
    onSuccess: () => {
      utils.admin.listEvents.invalidate();
      utils.admin.stats.invalidate();
      utils.audit.list.invalidate();
      toast.success("Événement créé");
      closeForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.admin.updateEvent.useMutation({
    onSuccess: () => {
      utils.admin.listEvents.invalidate();
      utils.audit.list.invalidate();
      toast.success("Événement mis à jour");
      closeForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deleteEvent.useMutation({
    onSuccess: () => {
      utils.admin.listEvents.invalidate();
      utils.admin.stats.invalidate();
      utils.audit.list.invalidate();
      toast.success("Événement supprimé");
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  const openCreate = () => {
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (ev: any) => {
    setForm({
      id: ev.id,
      title: ev.title ?? "",
      description: ev.description ?? "",
      location: ev.location ?? "",
      address: ev.address ?? "",
      startsAt: isoToLocal(ev.startsAt),
      endsAt: isoToLocal(ev.endsAt),
      price: ev.price ? String(ev.price) : "0",
      maxAttendees: ev.maxAttendees ? String(ev.maxAttendees) : "",
      coverImageUrl: ev.coverImageUrl ?? "",
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
    if (!form.startsAt) {
      toast.error("La date de début est requise");
      return;
    }
    const startsAtIso = localToIso(form.startsAt);
    const endsAtIso = form.endsAt ? localToIso(form.endsAt) : null;
    if (endsAtIso && new Date(endsAtIso) < new Date(startsAtIso)) {
      toast.error("La date de fin doit être après le début");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      address: form.address.trim() || null,
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      price: form.price ? Number(form.price) : 0,
      maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : null,
      coverImageUrl: form.coverImageUrl.trim() || null,
    };

    if (form.id) {
      updateMutation.mutate({ id: form.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const fmtPrice = (p: any) => {
    const n = Number(p);
    if (Number.isNaN(n) || n === 0) return "Gratuit";
    return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Événements</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {items.length} événement(s)
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouvel événement
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Titre
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Lieu
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Prix
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Inscrits
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
                  Aucun événement pour le moment.
                </td>
              </tr>
            ) : (
              items.map((ev: any) => (
                <tr
                  key={ev.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {ev.title}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fmtDate(ev.startsAt)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {ev.location || "-"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {fmtPrice(ev.price)}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {ev._count?.registrations ?? 0}
                    {ev.maxAttendees ? ` / ${ev.maxAttendees}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(ev)}
                        title="Modifier"
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground/80 hover:bg-muted/30"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDelete({ id: ev.id, title: ev.title })
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
              {form.id ? "Modifier l'événement" : "Nouvel événement"}
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
              <Field label="Lieu (nom)">
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Ex: Le Royal Monceau"
                  className="admin-input"
                />
              </Field>
              <Field label="Adresse">
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Ex: 37 Avenue Hoche, 75008 Paris"
                  className="admin-input"
                />
              </Field>
              <Field label="Début *">
                <input
                  required
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm({ ...form, startsAt: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Fin">
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm({ ...form, endsAt: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Prix (EUR)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  className="admin-input"
                />
              </Field>
              <Field label="Places maximum">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxAttendees}
                  onChange={(e) =>
                    setForm({ ...form, maxAttendees: e.target.value })
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
              Supprimer cet événement ?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              "{confirmDelete.title}" sera supprimé, ainsi que toutes les
              inscriptions.
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
