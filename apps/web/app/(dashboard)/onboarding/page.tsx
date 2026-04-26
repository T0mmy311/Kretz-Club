"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ArrowRight,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Camera,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const steps = [
  {
    title: "Bienvenue au Kretz Club",
    description: "Votre espace privé d’investissement immobilier. Découvrons ensemble ce que vous pouvez faire ici.",
    icon: null,
  },
  {
    title: "Messagerie",
    description: "Discutez avec les autres membres dans des channels thématiques : immobilier, investissement, entrepreneuriat. Envoyez aussi des messages privés.",
    icon: MessageSquare,
  },
  {
    title: "Investissements",
    description: "Accédez aux deals immobiliers exclusifs du Kretz Club. Consultez les decks, suivez vos investissements et votre portfolio.",
    icon: TrendingUp,
  },
  {
    title: "Événements",
    description: "Participez aux événements du club. Ajoutez-les directement à votre calendrier et retrouvez vos factures au même endroit.",
    icon: Calendar,
  },
  {
    title: "Annuaire",
    description: "Retrouvez tous les membres du club avec leur métier et ville. Idéal pour se recommander mutuellement. Pensez à compléter votre fiche !",
    icon: Users,
  },
  {
    title: "Raccourcis",
    description: "Utilisez Cmd+K (ou Ctrl+K) pour rechercher rapidement un membre, un channel ou un deal. Tout est à portée de main.",
    icon: Search,
  },
  {
    title: "Photo de profil",
    description: "Ajoutez une photo pour que les autres membres vous reconnaissent. C'est un club premium, montrons-nous au mieux.",
    icon: Camera,
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: profile } = trpc.member.me.useQuery();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null);

  const isLastStep = currentStep === steps.length - 1;
  const isPhotoStep = isLastStep; // photo step is now the last
  const step = steps[currentStep];

  const profileAvatarUrl = (profile as any)?.avatarUrl as string | null | undefined;
  const currentAvatar = uploadedAvatarUrl ?? profileAvatarUrl ?? null;
  const photoUploaded = !!uploadedAvatarUrl;

  const getInitials = () => {
    const p = profile as any;
    if (!p) return "?";
    return `${(p.firstName ?? "?")[0] ?? "?"}${(p.lastName ?? "")[0] ?? ""}`.toUpperCase();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.avatarUrl) {
        setUploadedAvatarUrl(data.avatarUrl);
        utils.member.me.invalidate();
        utils.member.list.invalidate();
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("kretz-onboarding-done", "true");
    router.push("/messagerie");
  };

  const handleNext = () => {
    if (isLastStep) {
      finishOnboarding();
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
          {step.icon && !isPhotoStep && (
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

          {/* Photo upload UI on the photo step */}
          {isPhotoStep && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-card border border-border transition-colors hover:bg-accent disabled:opacity-60"
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-muted-foreground">
                    {getInitials()}
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading ? (
                    <Loader2 className="h-7 w-7 animate-spin text-white" />
                  ) : (
                    <Camera className="h-7 w-7 text-white" />
                  )}
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5" />
                    {photoUploaded ? "Changer la photo" : "Choisir une photo"}
                  </>
                )}
              </button>

              {photoUploaded && (
                <p className="text-[13px] text-green-500 dark:text-green-400 animate-fade-in">
                  {"Photo téléchargée ✓"}
                </p>
              )}
              <p className="text-[12px] text-muted-foreground/60">
                JPG, PNG ou WebP. Max 2MB.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={handleNext}
            disabled={isPhotoStep && !photoUploaded}
            className="flex w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLastStep ? (
              <>
                <Check className="h-4 w-4" />
                Terminer
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

          {isPhotoStep && !photoUploaded && (
            <button
              onClick={finishOnboarding}
              className="text-[12px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Plus tard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
