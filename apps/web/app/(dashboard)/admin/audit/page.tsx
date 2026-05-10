"use client";

import { ScrollText } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const ACTION_LABELS: Record<string, string> = {
  "member.activate": "Activé un membre",
  "member.deactivate": "Désactivé un membre",
  "member.promote_admin": "Promu un membre admin",
  "member.demote_admin": "Retiré le statut admin",
  "invitation.create": "Créé une invitation",
  "invitation.delete": "Supprimé une invitation",
  "investment.create": "Créé un investissement",
  "investment.update": "Modifié un investissement",
  "investment.delete": "Supprimé un investissement",
  "event.create": "Créé un événement",
  "event.update": "Modifié un événement",
  "event.delete": "Supprimé un événement",
  "channel.create": "Créé un channel",
  "channel.update": "Modifié un channel",
  "channel.delete": "Supprimé un channel",
  "album.create": "Créé un album",
  "album.delete": "Supprimé un album",
  "photo.add": "Ajouté une photo",
  "photo.delete": "Supprimé une photo",
  "message.delete_admin": "Supprimé un message (modération)",
  "message.pin_admin": "Épinglé un message (modération)",
  "message.unpin_admin": "Désépinglé un message (modération)",
};

function formatActionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

export default function AdminAuditPage() {
  const { data, isLoading } = trpc.audit.list.useQuery({ limit: 100 });
  const logs = data?.items ?? [];

  const formatDateTime = (date: string | Date) =>
    new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Journal d'audit</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Historique des actions administratives
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Acteur
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Action
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Cible
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td colSpan={4} className="px-4 py-3">
                    <div className="h-4 w-48 animate-pulse rounded bg-muted/50" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Aucune action enregistrée pour le moment.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => {
                const actor = log.actor;
                const initials =
                  (actor?.firstName?.[0] ?? "") +
                  (actor?.lastName?.[0] ?? "");
                const meta = log.metadata as any;
                const target =
                  meta?.title ??
                  (meta?.firstName && meta?.lastName
                    ? `${meta.firstName} ${meta.lastName}`
                    : meta?.code
                      ? meta.code
                      : meta?.email
                        ? meta.email
                        : meta?.displayName
                          ? meta.displayName
                          : meta?.name
                            ? meta.name
                            : log.targetType
                              ? log.targetType
                              : "-");
                return (
                  <tr
                    key={log.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {actor?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={actor.avatarUrl}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                            {initials}
                          </div>
                        )}
                        <span className="text-foreground/80">
                          {actor
                            ? `${actor.firstName} ${actor.lastName}`
                            : "Inconnu"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {formatActionLabel(log.action)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {target}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
