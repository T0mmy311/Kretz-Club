"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  Mail,
  ScrollText,
  TrendingUp,
  Calendar,
  Hash,
  Image as ImageIcon,
  MessageSquareWarning,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/admin/membres", label: "Membres", icon: Users },
  { href: "/admin/invitations", label: "Invitations", icon: Mail },
  { href: "/admin/investissements", label: "Investissements", icon: TrendingUp },
  { href: "/admin/evenements", label: "Événements", icon: Calendar },
  { href: "/admin/channels", label: "Channels", icon: Hash },
  { href: "/admin/galerie", label: "Galerie", icon: ImageIcon },
  { href: "/admin/moderation", label: "Modération", icon: MessageSquareWarning },
  { href: "/admin/audit", label: "Audit logs", icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: me, isLoading } = trpc.member.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="text-sm text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!me || !(me as any).isAdmin) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-10 text-center">
        <Shield className="mb-4 h-10 w-10 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Accès refusé</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette section est réservée aux administrateurs du club.
        </p>
        <Link
          href="/messagerie"
          className="mt-6 inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/30"
        >
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Admin sidebar */}
      <aside className="border-b border-border bg-card lg:w-60 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Shield className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-semibold tracking-tight text-foreground/90">
            Administration
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:p-3">
          {adminNav.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground/80 hover:bg-muted/30 hover:text-foreground/80"
                )}
              >
                <Icon
                  className={cn(
                    "h-[16px] w-[16px]",
                    isActive ? "text-foreground/80" : "text-muted-foreground/60"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
