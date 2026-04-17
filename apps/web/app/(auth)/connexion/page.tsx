"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
      return;
    }

    router.push("/messagerie");
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm space-y-8 p-8">
      <div className="text-center">
        <img src="/logo-kretz-club.svg" alt="Kretz Club" className="mx-auto mb-6 h-16 w-16 opacity-90" />
        <h1 className="text-2xl font-semibold tracking-tight text-white">Kretz Club</h1>
        <p className="mt-2 text-[13px] text-white/40">
          {"Connectez-vous pour acc\u00e9der au club"}
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
          {"Mot de passe oubli\u00e9 ?"}
        </Link>
      </p>

      <p className="text-center text-[13px] text-white/30">
        {"Pas encore membre ? "}
        <Link href="/inscription" className="font-medium text-white/60 hover:text-white transition-colors">
          {"Cr\u00e9er un compte"}
        </Link>
      </p>
    </div>
  );
}
