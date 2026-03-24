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
  Crown,
  Menu,
  X,
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

// Bottom nav shows only the 5 most important items on mobile
const mobileNav = [
  { name: "Messages", href: "/messagerie", icon: MessageSquare },
  { name: "Deals", href: "/investissements", icon: TrendingUp },
  { name: "Events", href: "/evenements", icon: Calendar },
  { name: "Annuaire", href: "/annuaire", icon: Users },
  { name: "Plus", href: "", icon: Menu },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/connexion");
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/50 bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/50 px-6">
          <img src="/logo-kretz-club.svg" alt="Kretz Club" className="h-8 w-8" />
          <h1 className="text-xl font-bold tracking-tight text-gradient-gold">Kretz Club</h1>
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
          <Link href="/profil" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors">
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

      {/* Mobile Header */}
      <header className="flex lg:hidden items-center justify-between border-b border-border/50 bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo-kretz-club.svg" alt="Kretz Club" className="h-7 w-7" />
          <h1 className="text-lg font-bold text-gradient-gold">Kretz Club</h1>
        </div>
        <Link href="/profil" className="flex h-8 w-8 items-center justify-center rounded-full gradient-gold text-xs font-bold text-black">
          {getInitials(user?.name)}
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 lg:pb-0">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden border-t border-border/50 bg-card/95 backdrop-blur-lg safe-area-bottom">
        {mobileNav.map((item) => {
          if (item.name === "Plus") {
            return (
              <button
                key="plus"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                  mobileMenuOpen ? "text-primary" : "text-muted-foreground"
                )}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span>Plus</span>
              </button>
            );
          }
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile "Plus" menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute bottom-16 left-0 right-0 rounded-t-2xl border-t border-border/50 bg-card p-4 safe-area-bottom">
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { name: "Galerie", href: "/galerie", icon: Image },
                { name: "Factures", href: "/factures", icon: FileText },
                { name: "Profil", href: "/profil", icon: Users },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border border-border/50 p-4 text-sm transition-colors hover:bg-accent",
                    pathname.startsWith(item.href) && "border-primary/50 bg-primary/5 text-primary"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {"Se d\u00e9connecter"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
