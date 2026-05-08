"use client";

import { Heart, Shield, Eye, Award, ScrollText } from "lucide-react";

const valeurs = [
  {
    icon: Heart,
    title: "Respect mutuel",
    description:
      "Chaque membre est traité avec considération, quelle que soit sa position ou son expérience.",
  },
  {
    icon: Shield,
    title: "Confidentialité absolue",
    description:
      "Les échanges, deals et informations partagés au sein du club ne quittent jamais le cercle.",
  },
  {
    icon: Eye,
    title: "Transparence dans les deals",
    description:
      "Les opportunités d'investissement sont présentées avec honnêteté et clarté, sans dissimulation.",
  },
  {
    icon: Award,
    title: "Engagement et professionnalisme",
    description:
      "Chacun s'engage à maintenir un haut niveau de rigueur et à honorer ses prises de parole.",
  },
];

const regles = [
  "Restez courtois et professionnel dans vos échanges",
  "Ne partagez JAMAIS d'informations confidentielles à l'extérieur du club",
  "Les deals présentés sont strictement réservés aux membres",
  "Aucune sollicitation commerciale non liée à l'immobilier n'est tolérée",
  "Tout comportement déplacé sera sanctionné par une exclusion immédiate",
];

export default function ChartePage() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Charte du Kretz Club
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Les principes qui guident notre communauté
            </p>
          </div>
        </div>

        {/* Section 1 - Bienvenue */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground">
            Bienvenue au Kretz Club
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            Le Kretz Club est un cercle privé d'investisseurs et de
            professionnels de l'immobilier réunis autour d'une exigence commune :
            la qualité des échanges, la pertinence des opportunités et la
            confiance mutuelle. Cette charte formalise les engagements
            réciproques qui font la valeur du club.
          </p>
        </section>

        <div className="my-8 h-px bg-border" />

        {/* Section 2 - Nos valeurs */}
        <section>
          <h2 className="text-base font-semibold text-foreground">
            Nos valeurs
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {valeurs.map((v) => (
              <div
                key={v.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/30">
                  <v.icon className="h-[18px] w-[18px] text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    {v.title}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    {v.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="my-8 h-px bg-border" />

        {/* Section 3 - Règles */}
        <section>
          <h2 className="text-base font-semibold text-foreground">
            Règles de bonne conduite
          </h2>
          <ol className="mt-5 space-y-3">
            {regles.map((regle, i) => (
              <li
                key={i}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-[12px] font-semibold text-foreground/80">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {regle}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="my-8 h-px bg-border" />

        {/* Section 4 - Confidentialité */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground">
            Confidentialité
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            En rejoignant le Kretz Club, chaque membre s'engage à un strict devoir
            de confidentialité, équivalent à un accord de non-divulgation (NDA).
            Les informations partagées — qu'il s'agisse de deals immobiliers,
            de discussions stratégiques, de coordonnées de membres ou de
            documents internes — ne peuvent en aucun cas être transmises,
            citées ou exploitées en dehors du cercle, ni de votre vivant ni
            après votre départ du club. Toute fuite avérée entraîne une
            exclusion définitive et peut faire l'objet de poursuites.
          </p>
        </section>

        <div className="my-8 h-px bg-border" />

        {/* Section 5 - Modération */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold text-foreground">
            Modération
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            Pour signaler un comportement inapproprié, un contenu déplacé ou
            toute violation de la présente charte, contactez directement un
            administrateur via la messagerie privée. Les signalements sont
            traités avec discrétion et célérité. Les administrateurs disposent
            du pouvoir d'avertir, de suspendre ou d'exclure tout membre dont la
            conduite contrevient aux engagements du club.
          </p>
        </section>

        {/* Footer */}
        <p className="mt-10 text-center text-[11px] text-muted-foreground/60">
          Charte applicable à l'ensemble des membres du Kretz Club.
        </p>
      </div>
    </div>
  );
}
