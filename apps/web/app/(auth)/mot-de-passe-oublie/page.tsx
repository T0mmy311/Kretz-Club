"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) {
      setError("Une erreur est survenue. Veuillez vérifier votre adresse email et réessayer.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm space-y-8 p-8">
      <div className="text-center">
        <img src="/logo-kretz-club.svg" alt="Kretz Club" className="mx-auto mb-6 h-16 w-16 opacity-90" />
        <h1 className="text-2xl font-semibold tracking-tight text-white">Mot de passe oublié</h1>
        <p className="mt-2 text-[13px] text-white/40">
          {"Entrez votre email pour recevoir un lien de r\u00e9initialisation"}
        </p>
      </div>

      {success ? (
        <div className="space-y-4">
          <div className="rounded-md border border-green-500/20 bg-green-500/10 px-4 py-3 text-[13px] text-green-400">
            {"Un email de r\u00e9initialisation a \u00e9t\u00e9 envoy\u00e9 \u00e0 votre adresse"}
          </div>
          <Link
            href="/connexion"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              className="block w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-white px-4 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "R\u00e9initialiser mon mot de passe"}
          </button>
        </form>
      )}

      <p className="text-center text-[13px] text-white/30">
        <Link href="/connexion" className="font-medium text-white/60 hover:text-white transition-colors">
          {"Retour \u00e0 la connexion"}
        </Link>
      </p>
    </div>
  );
}
