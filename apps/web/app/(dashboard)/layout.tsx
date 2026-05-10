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
  Menu,
  X,
  ScrollText,
  Shield,
  HandHeart,
  GraduationCap,
  Video,
  BookOpen,
} from "lucide-react";
import { Toaster } from "sonner";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import SearchPalette from "@/components/SearchPalette";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NotificationPrompt from "@/components/NotificationPrompt";
import GlobalNotifications from "@/components/GlobalNotifications";
import ThemeToggle from "@/components/ThemeToggle";
import BirthdayBanner from "@/components/BirthdayBanner";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { trpc } from "@/lib/trpc/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const tNav = useTranslations("nav");

  const navigation = [
    { name: tNav("messagerie"), href: "/messagerie", icon: MessageSquare },
    { name: tNav("investissements"), href: "/investissements", icon: TrendingUp },
    { name: tNav("evenements"), href: "/evenements", icon: Calendar },
    { name: tNav("replays"), href: "/replays", icon: Video },
    { name: tNav("annuaire"), href: "/annuaire", icon: Users },
    { name: tNav("mentorat"), href: "/mentorat", icon: GraduationCap },
    { name: tNav("entraide"), href: "/entraide", icon: HandHeart },
    { name: tNav("galerie"), href: "/galerie", icon: Image },
    { name: tNav("bibliotheque"), href: "/bibliotheque", icon: BookOpen },
    { name: tNav("factures"), href: "/factures", icon: FileText },
  ];

  const mobileNav = [
    { name: tNav("messages"), href: "/messagerie", icon: MessageSquare },
    { name: tNav("investissementsShort"), href: "/investissements", icon: TrendingUp },
    { name: tNav("events"), href: "/evenements", icon: Calendar },
    { name: tNav("annuaire"), href: "/annuaire", icon: Users },
    { name: tNav("more"), href: "", icon: Menu },
  ];
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useServiceWorker();
  const { messagerieUnread } = useUnreadCounts();
  const { data: meData } = trpc.member.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const memberAvatarUrl = (meData as any)?.avatarUrl as string | null | undefined;
  const isAdmin = (meData as any)?.isAdmin === true;

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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 px-5">
          <img src="/logo-kretz-club.svg" alt="Kretz Club" className="h-7 w-7 opacity-90" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground/90">Kretz Club</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-2">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const badge = item.href === "/messagerie" && messagerieUnread > 0 ? messagerieUnread : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground/80 hover:bg-muted/30 hover:text-foreground/70"
                  )}
                >
                  <item.icon className={cn("h-[18px] w-[18px]", isActive ? "text-foreground/80" : "text-muted-foreground/60")} />
                  {item.name}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-muted text-foreground"
                    : "text-amber-400/80 hover:bg-muted/30 hover:text-amber-400"
                )}
              >
                <Shield className={cn("h-[18px] w-[18px]", pathname.startsWith("/admin") ? "text-foreground/80" : "text-amber-400/70")} />
                {tNav("admin")}
              </Link>
            )}
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-border p-3">
          <Link href="/profil" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/30 transition-colors">
            {memberAvatarUrl ? (
              <img src={memberAvatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground/80">{user?.name || "..."}</p>
              <p className="truncate text-[11px] text-muted-foreground/60">{user?.email}</p>
            </div>
          </Link>
          <Link
            href="/charte"
            className={cn(
              "mt-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors",
              pathname.startsWith("/charte")
                ? "bg-muted/50 text-foreground/80"
                : "text-muted-foreground/60 hover:bg-muted/30 hover:text-muted-foreground"
            )}
          >
            <ScrollText className="h-[16px] w-[16px]" />
            {tNav("charte")}
          </Link>
          <div className="mt-0.5 flex items-center gap-1">
            <button
              onClick={handleSignOut}
              className="flex flex-1 items-center gap-3 rounded-md px-3 py-2 text-[13px] text-muted-foreground/60 hover:bg-muted/30 hover:text-muted-foreground transition-colors"
            >
              <LogOut className="h-[16px] w-[16px]" />
              {tNav("deconnecter")}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="flex lg:hidden items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img src="/logo-kretz-club.svg" alt="Kretz Club" className="h-6 w-6 opacity-90" />
          <span className="text-[15px] font-semibold text-foreground/90">Kretz Club</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/profil" className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground overflow-hidden">
            {memberAvatarUrl ? (
              <img src={memberAvatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              getInitials(user?.name)
            )}
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background pb-16 lg:pb-0">
        <NotificationPrompt />
        <PWAInstallPrompt />
        <BirthdayBanner />
        {children}
      </main>
      <GlobalNotifications />

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden border-t border-border bg-card/95 backdrop-blur-xl safe-area-bottom">
        {mobileNav.map((item) => {
          if (item.name === "Plus") {
            return (
              <button
                key="plus"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
                  mobileMenuOpen ? "text-foreground" : "text-muted-foreground/60"
                )}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span>{tNav("more")}</span>
              </button>
            );
          }
          const isActive = pathname.startsWith(item.href);
          const badge = item.href === "/messagerie" && messagerieUnread > 0 ? messagerieUnread : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground/60"
              )}
            >
              <item.icon className="h-5 w-5" />
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile "Plus" menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute bottom-16 left-0 right-0 rounded-t-2xl border-t border-border bg-card p-4 safe-area-bottom animate-fade-in">
            <div className="mb-4 grid grid-cols-3 gap-2.5">
              {[
                { name: tNav("replays"), href: "/replays", icon: Video },
                { name: tNav("mentorat"), href: "/mentorat", icon: GraduationCap },
                { name: tNav("entraide"), href: "/entraide", icon: HandHeart },
                { name: tNav("galerie"), href: "/galerie", icon: Image },
                { name: tNav("bibliotheque"), href: "/bibliotheque", icon: BookOpen },
                { name: tNav("factures"), href: "/factures", icon: FileText },
                { name: tNav("profile"), href: "/profil", icon: Users },
                { name: tNav("charteShort"), href: "/charte", icon: ScrollText },
                ...(isAdmin
                  ? [{ name: tNav("admin"), href: "/admin", icon: Shield }]
                  : []),
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-sm transition-colors hover:bg-muted/30",
                    pathname.startsWith(item.href) && "border-accent bg-muted/30"
                  )}
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[11px] font-medium text-muted-foreground">{item.name}</span>
                </Link>
              ))}
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-[13px] font-medium text-muted-foreground/80 hover:bg-muted/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {tNav("deconnecter")}
            </button>
          </div>
        </div>
      )}
      <SearchPalette />
      <Toaster theme="dark" position="top-right" />
    </div>
  );
}
