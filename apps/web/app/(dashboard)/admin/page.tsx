"use client";

import Link from "next/link";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Mail,
  Hash,
  Image as ImageIcon,
  ScrollText,
  MessageSquareWarning,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function AdminOverviewPage() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  const statCards = [
    { label: "Membres", value: stats?.totalMembers ?? "-", icon: Users },
    { label: "Messages", value: stats?.totalMessages ?? "-", icon: MessageSquare },
    {
      label: "Investissements",
      value: stats?.totalInvestments ?? "-",
      icon: TrendingUp,
    },
    { label: "Événements", value: stats?.totalEvents ?? "-", icon: Calendar },
  ];

  const sections = [
    {
      href: "/admin/membres",
      title: "Membres",
      description: "Gérer les membres, activer/désactiver un compte",
      icon: Users,
    },
    {
      href: "/admin/invitations",
      title: "Invitations",
      description: "Générer et suivre les codes d'invitation",
      icon: Mail,
    },
    {
      href: "/admin/investissements",
      title: "Investissements",
      description: "Créer et modifier les deals proposés au club",
      icon: TrendingUp,
    },
    {
      href: "/admin/evenements",
      title: "Événements",
      description: "Programmer et gérer les événements du club",
      icon: Calendar,
    },
    {
      href: "/admin/channels",
      title: "Channels",
      description: "Configurer les channels de discussion",
      icon: Hash,
    },
    {
      href: "/admin/galerie",
      title: "Galerie",
      description: "Créer des albums et ajouter des photos",
      icon: ImageIcon,
    },
    {
      href: "/admin/moderation",
      title: "Modération",
      description: "Modérer les messages des channels",
      icon: MessageSquareWarning,
    },
    {
      href: "/admin/audit",
      title: "Audit logs",
      description: "Historique des actions administratives",
      icon: ScrollText,
    },
  ];

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Vue d'ensemble du club
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">
              {isLoading ? "..." : stat.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Sections grid */}
      <h3 className="mb-3 text-lg font-semibold text-foreground/80">
        Sections d'administration
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-muted/20"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-muted/40 p-2">
                  <Icon className="h-5 w-5 text-foreground/80" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">
                    {s.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
