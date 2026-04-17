"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, MessageSquare, TrendingUp, Users, Calendar, Search } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const steps = [
  {
    title: "Bienvenue au Kretz Club",
    description: "Votre espace priv\u00e9 d\u2019investissement immobilier. D\u00e9couvrons ensemble ce que vous pouvez faire ici.",
    icon: null,
  },
  {
    title: "Messagerie",
    description: "Discutez avec les autres membres dans des channels th\u00e9matiques : immobilier, investissement, entrepreneuriat. Envoyez aussi des messages priv\u00e9s.",
    icon: MessageSquare,
  },
  {
    title: "Investissements",
    description: "Acc\u00e9dez aux deals immobiliers exclusifs du Kretz Club. Consultez les decks, suivez vos investissements et votre portfolio.",
    icon: TrendingUp,
  },
  {
    title: "\u00c9v\u00e9nements",
    description: "Participez aux \u00e9v\u00e9nements du club. Ajoutez-les directement \u00e0 votre calendrier et retrouvez vos factures au m\u00eame endroit.",
    icon: Calendar,
  },
  {
    title: "Annuaire",
    description: "Retrouvez tous les membres du club avec leur m\u00e9tier et ville. Id\u00e9al pour se recommander mutuellement. Pensez \u00e0 compl\u00e9ter votre fiche !",
    icon: Users,
  },
  {
    title: "Raccourcis",
    description: "Utilisez Cmd+K (ou Ctrl+K) pour rechercher rapidement un membre, un channel ou un deal. Tout est \u00e0 port\u00e9e de main.",
    icon: Search,
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const utils = trpc.useUtils();

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const handleNext = () => {
    if (isLastStep) {
      // Mark onboarding as completed in localStorage
      localStorage.setItem("kretz-onboarding-done", "true");
      router.push("/profil");
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("kretz-onboarding-done", "true");
    router.push("/messagerie");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 lg:min-h-screen">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="mb-8 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "w-8 bg-foreground"
                  : i < currentStep
                  ? "w-1.5 bg-foreground/40"
                  : "w-1.5 bg-foreground/10"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center animate-fade-in" key={currentStep}>
          {step.icon && (
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
              <step.icon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {currentStep === 0 && (
            <div className="mx-auto mb-6">
              <img src="/logo-kretz-club.svg" alt="Kretz Club" className="mx-auto h-16 w-16 opacity-90" />
            </div>
          )}

          <h2 className="text-2xl font-semibold text-foreground">{step.title}</h2>
          <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
            {step.description}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={handleNext}
            className="flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isLastStep ? (
              <>
                <Check className="h-4 w-4" />
                {"Compl\u00e9ter mon profil"}
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="text-[13px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Passer le guide
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
