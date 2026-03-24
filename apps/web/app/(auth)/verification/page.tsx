import Link from "next/link";

export default function VerificationPage() {
  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-8 w-8 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Verifiez votre email</h1>
        <p className="mt-2 text-muted-foreground">
          Un lien de connexion a ete envoye a votre adresse email. Cliquez
          dessus pour acceder au Kretz Club.
        </p>
      </div>

      <Link
        href="/connexion"
        className="inline-block text-sm text-muted-foreground underline hover:text-foreground"
      >
        Retour a la connexion
      </Link>
    </div>
  );
}
