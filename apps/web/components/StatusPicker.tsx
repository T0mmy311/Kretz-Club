"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

const STATUS_EMOJIS = ["🏠", "💼", "🏖️", "🎯", "📞", "✈️", "🔴", "🟢"];

export default function StatusPicker({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [emoji, setEmoji] = useState<string | undefined>();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const setStatus = trpc.presence.setStatus.useMutation({
    onSuccess: () => {
      utils.presence.getOnline.invalidate();
      onClose();
    },
  });

  const clearStatus = trpc.presence.clearStatus.useMutation({
    onSuccess: () => {
      utils.presence.getOnline.invalidate();
      onClose();
    },
  });

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const handleSave = () => {
    if (!text && !emoji) {
      clearStatus.mutate();
    } else {
      setStatus.mutate({
        statusText: text || undefined,
        statusEmoji: emoji,
      });
    }
  };

  const handleClear = () => {
    setText("");
    setEmoji(undefined);
    clearStatus.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-72 rounded-lg border border-white/[0.08] bg-[hsl(0,0%,6%)] p-4 shadow-xl animate-fade-in z-50"
    >
      <p className="mb-3 text-[13px] font-medium text-white/70">
        Définir un statut
      </p>

      {/* Emoji grid */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {STATUS_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setEmoji(emoji === e ? undefined : e)}
            className={`flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors ${
              emoji === e
                ? "bg-white/[0.12] ring-1 ring-white/20"
                : "hover:bg-white/[0.06]"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        placeholder="En réunion, en vacances..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={100}
        className="mb-3 w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white/90 placeholder:text-white/25 outline-none focus:border-white/[0.15] transition-colors"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={setStatus.isPending}
          className="flex-1 rounded-md bg-white/[0.08] px-3 py-1.5 text-[12px] font-medium text-white/70 hover:bg-white/[0.12] transition-colors disabled:opacity-50"
        >
          Enregistrer
        </button>
        <button
          onClick={handleClear}
          disabled={clearStatus.isPending}
          className="rounded-md px-3 py-1.5 text-[12px] text-white/30 hover:bg-white/[0.04] hover:text-white/50 transition-colors disabled:opacity-50"
        >
          Effacer le statut
        </button>
      </div>
    </div>
  );
}
