"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-md p-2 text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground transition-colors"
      title={theme === "dark" ? "Mode clair" : "Mode sombre"}
    >
      {theme === "dark" ? (
        <Sun className="h-[16px] w-[16px]" />
      ) : (
        <Moon className="h-[16px] w-[16px]" />
      )}
    </button>
  );
}
