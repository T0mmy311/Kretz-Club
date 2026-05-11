"use client";

import { usePathname } from "next/navigation";
import { MessageriesSidebar } from "@/components/MessageriesSidebar";
import { cn } from "@/lib/utils";

export default function MessagerieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Are we inside a specific channel or DM conversation?
  const isInChannelOrDm =
    pathname !== "/messagerie" && pathname.startsWith("/messagerie/");

  return (
    <div className="flex h-full">
      {/* Sidebar:
          - Mobile: full width when on /messagerie, hidden when inside a channel/DM
          - Desktop: always 320px on the left */}
      <aside
        className={cn(
          "w-full border-r border-border/50 lg:flex lg:w-80",
          isInChannelOrDm ? "hidden lg:flex" : "flex"
        )}
      >
        <MessageriesSidebar />
      </aside>

      {/* Content area:
          - Mobile: full width when inside a channel/DM, hidden on /messagerie
          - Desktop: takes remaining space */}
      <main
        className={cn(
          "flex-1 lg:flex",
          isInChannelOrDm ? "flex" : "hidden lg:flex"
        )}
      >
        {children}
      </main>
    </div>
  );
}
