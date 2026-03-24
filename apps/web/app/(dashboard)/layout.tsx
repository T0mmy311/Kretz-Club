"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  TrendingUp,
  Calendar,
  Users,
  Image,
  FileText,
  LogOut,
  User,
  Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Messagerie", href: "/messagerie", icon: MessageSquare },
  { name: "Investissements", href: "/investissements", icon: TrendingUp },
  { name: "\u00c9v\u00e9nements", href: "/evenements", icon: Calendar },
  { name: "Annuaire", href: "/annuaire", icon: Users },
  { name: "Galerie", href: "/galerie", icon: Image },
  { name: "Factures", href: "/factures", icon: FileText },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
        });
      }
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/connexion");
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-border/50 bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-gold">
            <Crown className="h-4 w-4 text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gradient-gold">
            Kretz Club
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border/50 p-3">
          <Link
            href="/profil"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-gold text-xs font-bold text-black">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">{user?.name || "..."}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {"Se d\u00e9connecter"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
