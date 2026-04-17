"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">Une erreur est survenue</h2>
        <p className="mt-2 text-[13px] text-white/40">
          {"Nous nous excusons pour la g\u00eane occasionn\u00e9e. Veuillez r\u00e9essayer."}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-white/[0.08] px-4 py-2 text-[13px] font-medium text-white/60 hover:bg-white/[0.12] transition-colors"
        >
          {"R\u00e9essayer"}
        </button>
      </div>
    </div>
  );
}
