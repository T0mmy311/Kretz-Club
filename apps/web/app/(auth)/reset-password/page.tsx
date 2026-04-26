"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      const msg = updateError.message.toLowerCase();
      if (msg.includes("session") || msg.includes("expired") || msg.includes("invalid")) {
        setError("Lien de réinitialisation invalide ou expiré. Veuillez recommencer.");
      } else if (msg.includes("same") || msg.includes("different")) {
        setError("Le nouveau mot de passe doit être différent de l'ancien.");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      router.push("/messagerie");
      router.refresh();
    }, 2000);
  };

  return (
    <div className="w-full max-w-sm space-y-8 p-8">
      <div className="text-center">
        <img src="/logo-kretz-club.svg" alt="Kretz Club" className="mx-auto mb-6 h-16 w-16 opacity-90" />
        <h1 className="text-2xl font-semibold tracking-tight text-white">{"Réinitialiser le mot de passe"}</h1>
        <p className="mt-2 text-[13px] text-white/40">
          {"Choisissez un nouveau mot de passe pour votre compte"}
        </p>
      </div>

      {success ? (
        <div className="rounded-md border border-green-500/20 bg-green-500/10 px-4 py-3 text-center text-[13px] text-green-400">
          {"Mot de passe mis à jour"}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">
              {"Nouveau mot de passe"}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={"Minimum 6 caractères"}
                required
                className="block w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 pr-10 text-[14px] text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">
              {"Confirmer le mot de passe"}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={"Répétez votre mot de passe"}
                required
                className="block w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 pr-10 text-[14px] text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-[13px] text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-white px-4 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Mettre à jour"}
          </button>
        </form>
      )}
    </div>
  );
}
