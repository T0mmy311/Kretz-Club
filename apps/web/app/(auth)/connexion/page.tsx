"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    // Check if MFA is required
    try {
      const { data: aalData, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        // If we can't determine AAL, default to redirect (don't block login)
        router.push("/messagerie");
        router.refresh();
        return;
      }

      // nextLevel === "aal2" and currentLevel === "aal1" means MFA is needed
      if (aalData?.nextLevel === "aal2" && aalData?.currentLevel === "aal1") {
        const { data: factorsData, error: factorsError } =
          await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const verifiedTotp = (factorsData?.totp || []).find(
          (f: any) => f.status === "verified"
        );

        if (!verifiedTotp) {
          // No verified factor — proceed to login normally
          router.push("/messagerie");
          router.refresh();
          return;
        }

        // Issue challenge
        const { data: challenge, error: chErr } =
          await supabase.auth.mfa.challenge({ factorId: verifiedTotp.id });
        if (chErr) throw chErr;

        setMfaFactorId(verifiedTotp.id);
        setMfaChallengeId(challenge.id);
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      // No MFA required — proceed
      router.push("/messagerie");
      router.refresh();
    } catch (err) {
      console.error("MFA check error:", err);
      // Fail-open: if MFA check fails, still let the user in (they passed password)
      router.push("/messagerie");
      router.refresh();
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId || !mfaChallengeId || mfaCode.length !== 6) {
      setMfaError("Entrez un code à 6 chiffres");
      return;
    }
    setMfaError(null);
    setMfaLoading(true);
    try {
      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode,
      });
      if (verErr) {
        setMfaError("Code invalide");
        setMfaLoading(false);
        return;
      }
      router.push("/messagerie");
      router.refresh();
    } catch (err: any) {
      console.error("Verify error:", err);
      setMfaError(err.message || "Erreur de vérification");
      setMfaLoading(false);
    }
  };

  const handleCancelMfa = async () => {
    await supabase.auth.signOut();
    setMfaRequired(false);
    setMfaFactorId(null);
    setMfaChallengeId(null);
    setMfaCode("");
    setMfaError(null);
  };

  if (mfaRequired) {
    return (
      <div className="w-full max-w-sm space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
            <Shield className="h-7 w-7 text-white/70" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {"Vérification 2FA"}
          </h1>
          <p className="mt-2 text-[13px] text-white/40">
            {"Entrez le code à 6 chiffres de votre application"}
          </p>
        </div>

        <form onSubmit={handleVerifyMfa} className="space-y-4">
          <div>
            <label
              htmlFor="mfa-code"
              className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2"
            >
              {"Code de vérification"}
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(e) =>
                setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              autoFocus
              required
              className="block w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-center text-base font-mono tracking-[0.5em] text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          {mfaError && <p className="text-[13px] text-red-400">{mfaError}</p>}

          <button
            type="submit"
            disabled={mfaLoading || mfaCode.length !== 6}
            className="w-full rounded-md bg-white px-4 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {mfaLoading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Vérifier"
            )}
          </button>

          <button
            type="button"
            onClick={handleCancelMfa}
            className="w-full text-center text-[13px] text-white/40 hover:text-white/60 transition-colors"
          >
            Annuler
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8 p-8">
      <div className="text-center">
        <img src="/logo-kretz-club.svg" alt="Kretz Club" className="mx-auto mb-6 h-16 w-16 opacity-90" />
        <h1 className="text-2xl font-semibold tracking-tight text-white">Kretz Club</h1>
        <p className="mt-2 text-[13px] text-white/40">
          {"Connectez-vous pour accéder au club"}
        </p>
      </div>

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

        <div>
          <label htmlFor="password" className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">Mot de passe</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={"Votre mot de passe"}
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

        {error && <p className="text-[13px] text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-white px-4 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-[13px]">
        <Link href="/mot-de-passe-oublie" className="font-medium text-white/40 hover:text-white transition-colors">
          {"Mot de passe oublié ?"}
        </Link>
      </p>

      <p className="text-center text-[13px] text-white/30">
        {"Pas encore membre ? "}
        <Link href="/inscription" className="font-medium text-white/60 hover:text-white transition-colors">
          {"Créer un compte"}
        </Link>
      </p>
    </div>
  );
}
