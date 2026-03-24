"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't show if already dismissed
    if (localStorage.getItem("pwa-install-dismissed") === "1") return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.04] px-4 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <Download className="h-4 w-4 shrink-0 text-white/50" />
        <span className="truncate text-[13px] text-white/80">
          Installer Kretz Club
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="rounded-md bg-white/[0.08] px-3 py-1 text-[12px] font-medium text-white/90 transition-colors hover:bg-white/[0.12]"
        >
          Installer
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
