"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function InscriptionPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caract\u00e8res");
      setLoading(false);
      return;
    }

    // Validate invitation code before signup
    try {
      const inviteRes = await fetch("/api/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });
      const inviteData = await inviteRes.json();
      if (!inviteData.valid) {
        setError("Code d'invitation invalide ou expir\u00e9");
        setLoading(false);
        return;
      }
    } catch {
      setError("Erreur lors de la v\u00e9rification du code d'invitation");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          invite_code: inviteCode,
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setError("Cet email est d\u00e9j\u00e0 utilis\u00e9. Connectez-vous plut\u00f4t.");
      } else if (msg.includes("rate limit")) {
        setError("Trop de tentatives. Veuillez r\u00e9essayer dans quelques minutes.");
      } else if (msg.includes("invalid")) {
        setError("Adresse email invalide.");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    // If the user already has an active session (no email confirmation required),
    // create the member record now and consume the invite. Otherwise, the
    // /api/auth/callback handler will do it after email verification.
    if (data.session && data.user) {
      try {
        await fetch("/api/auth/create-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName }),
        });

        await fetch("/api/auth/use-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: inviteCode }),
        });
      } catch {
        // Non-blocking; the callback / next sign-in will reconcile.
      }

      router.push("/onboarding");
      router.refresh();
      return;
    }

    // No active session: email verification is required. Send to /verification.
    router.push("/verification");
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm space-y-8 p-8">
      <div className="text-center">
        <img src="/logo-kretz-club.svg" alt="Kretz Club" className="mx-auto mb-6 h-16 w-16 opacity-90" />
        <h1 className="text-2xl font-semibold tracking-tight text-white">Kretz Club</h1>
        <p className="mt-2 text-[13px] text-white/40">
          {"Cr\u00e9ez votre compte"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inviteCode" className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">
            {"Code d\u2019invitation"}
          </label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Entrez votre code d'invitation"
            required
            className="block w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">
              {"Pr\u00e9nom"}
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="block w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="block w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">
            Adresse email
          </label>
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
          <label htmlFor="password" className="block text-[12px] font-medium text-white/50 uppercase tracking-wider mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={"Minimum 6 caract\u00e8res"}
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

        {error && (
          <p className="text-[13px] text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-white px-4 py-2.5 text-[14px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Cr\u00e9er mon compte"}
        </button>
      </form>

      <p className="text-center text-[13px] text-white/30">
        {"D\u00e9j\u00e0 membre ? "}
        <Link href="/connexion" className="font-medium text-white/60 hover:text-white transition-colors">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
