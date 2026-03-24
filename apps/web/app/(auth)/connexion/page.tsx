"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="w-full max-w-md space-y-8 rounded-2xl border border-border/50 bg-card p-8 shadow-2xl shadow-primary/5">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl gradient-gold">
          <Crown className="h-7 w-7 text-black" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gradient-gold">Kretz Club</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {"Connectez-vous pour acc\u00e9der au club"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Adresse email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg gradient-gold px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {"Pas encore membre ? "}
        <Link href="/inscription" className="font-medium text-primary hover:underline">
          {"Cr\u00e9er un compte"}
        </Link>
      </p>
    </div>
  );
}
