"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Camera, Loader2, Shield, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";

export default function ProfilPage() {
  const { data: profile, isLoading } = trpc.member.me.useQuery();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const updateProfile = trpc.member.updateProfile.useMutation({
    onSuccess: () => {
      utils.member.me.invalidate();
      utils.member.list.invalidate();
      toast.success("Profil mis à jour");
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la mise à jour");
    },
  });

  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // 2FA state
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [mfaEnrollData, setMfaEnrollData] = useState<{
    factorId: string;
    qrCode: string;
    secret: string;
  } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const isAdmin = (profile as any)?.isAdmin === true;
  const verifiedFactor = mfaFactors.find((f: any) => f.status === "verified");
  const has2FA = !!verifiedFactor;

  // Load MFA factors on mount
  useEffect(() => {
    const loadFactors = async () => {
      setMfaLoading(true);
      try {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        const allFactors = [
          ...(data?.totp || []),
          ...(data?.all || []),
        ];
        // Dedupe by id
        const seen = new Set<string>();
        const dedup = allFactors.filter((f: any) => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });
        setMfaFactors(dedup);
      } catch (err) {
        console.error("MFA listFactors error:", err);
      } finally {
        setMfaLoading(false);
      }
    };
    if (isAdmin) loadFactors();
    else setMfaLoading(false);
  }, [isAdmin, supabase]);

  const refreshFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const allFactors = [...(data?.totp || []), ...(data?.all || [])];
    const seen = new Set<string>();
    setMfaFactors(
      allFactors.filter((f: any) => {
        if (seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      })
    );
  };

  const handleEnable2FA = async () => {
    setMfaError(null);
    setMfaEnrolling(true);
    try {
      // Clean any pre-existing unverified factors first
      const { data: list } = await supabase.auth.mfa.listFactors();
      const allFactors = [...(list?.totp || []), ...(list?.all || [])];
      for (const f of allFactors) {
        if ((f as any).status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: (f as any).id });
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Kretz Club (${Date.now()})`,
      });
      if (error) throw error;
      setMfaEnrollData({
        factorId: data.id,
        qrCode: (data as any).totp?.qr_code,
        secret: (data as any).totp?.secret,
      });
    } catch (err: any) {
      console.error("Enroll error:", err);
      setMfaError(err.message || "Erreur lors de l'activation");
      setMfaEnrolling(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!mfaEnrollData || !mfaCode || mfaCode.length !== 6) {
      setMfaError("Entrez un code à 6 chiffres");
      return;
    }
    setMfaError(null);
    setMfaVerifying(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: mfaEnrollData.factorId,
      });
      if (chErr) throw chErr;
      const { error: verErr } = await supabase.auth.mfa.verify({
        factorId: mfaEnrollData.factorId,
        challengeId: challenge.id,
        code: mfaCode,
      });
      if (verErr) throw verErr;
      // Success
      setMfaEnrollData(null);
      setMfaEnrolling(false);
      setMfaCode("");
      await refreshFactors();
    } catch (err: any) {
      console.error("Verify error:", err);
      setMfaError(err.message || "Code invalide");
    } finally {
      setMfaVerifying(false);
    }
  };

  const handleCancelEnroll = async () => {
    if (mfaEnrollData) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: mfaEnrollData.factorId });
      } catch (err) {
        console.error("Cancel unenroll error:", err);
      }
    }
    setMfaEnrollData(null);
    setMfaEnrolling(false);
    setMfaCode("");
    setMfaError(null);
  };

  const handleDisable2FA = async () => {
    if (!verifiedFactor) return;
    setDisabling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id });
      if (error) throw error;
      await refreshFactors();
      setShowDisableConfirm(false);
    } catch (err: any) {
      console.error("Disable error:", err);
      setMfaError(err.message || "Erreur lors de la désactivation");
    } finally {
      setDisabling(false);
    }
  };

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    profession: "",
    bio: "",
    company: "",
    phone: "",
    city: "",
    linkedinUrl: "",
  });

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setForm({
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        profession: p.profession || "",
        bio: p.bio || "",
        company: p.company || "",
        phone: p.phone || "",
        city: p.city || "",
        linkedinUrl: p.linkedinUrl || "",
      });
      setAvatarUrl(p.avatarUrl || null);
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(form);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
        setAvatarUrl(data.avatarUrl);
        utils.member.me.invalidate();
        utils.member.list.invalidate();
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    return `${(form.firstName || "?")[0]}${(form.lastName || "")[0] || ""}`.toUpperCase();
  };

  const inputClass = "mt-1.5 block w-full rounded-md border border-border bg-muted/30 px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:border-border/80 focus:outline-none focus:ring-0 transition-colors";
  const labelClass = "block text-[12px] font-medium text-muted-foreground uppercase tracking-wider";

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground">Mon profil</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {"Mettez \u00e0 jour vos informations personnelles"}
        </p>
      </div>

      <div className="max-w-2xl">
        {/* Avatar upload */}
        <div className="mb-8 flex items-center gap-5">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted transition-colors hover:bg-accent"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-semibold text-muted-foreground">{getInitials()}</span>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
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
          </div>
          <div>
            <p className="text-[14px] font-medium text-foreground/80">Photo de profil</p>
            <p className="text-[12px] text-muted-foreground/60">JPG, PNG ou WebP. Max 2MB.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{"Pr\u00e9nom"}</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nom</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Profession</label>
              <input name="profession" value={form.profession} onChange={handleChange} placeholder={"D\u00e9veloppeur, Architecte, Avocat..."} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Entreprise</label>
              <input name="company" value={form.company} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ville</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Paris, Lyon, Marseille..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{"T\u00e9l\u00e9phone"}</label>
              <input name="phone" value={form.phone} onChange={handleChange} type="tel" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Quelques mots sur vous..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>LinkedIn</label>
            <input
              name="linkedinUrl"
              value={form.linkedinUrl}
              onChange={handleChange}
              type="url"
              placeholder="https://linkedin.com/in/..."
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="rounded-md bg-white px-6 py-2.5 text-[13px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {updateProfile.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-3.5 w-3.5" />
                  Enregistrer
                </span>
              )}
            </button>

          </div>
        </form>

        {/* Security section - admins only */}
        {isAdmin && (
          <div className="mt-12 border-t border-border pt-8">
            <div className="mb-6 flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-[15px] font-semibold text-foreground">{"S\u00e9curit\u00e9"}</h3>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[14px] font-medium text-foreground/90">
                    {"Authentification \u00e0 deux facteurs (2FA)"}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground/70">
                    {"Ajoute une couche de s\u00e9curit\u00e9 \u00e0 votre compte avec une application d'authentification."}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {mfaLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/60" />
                    ) : has2FA ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-medium text-green-400">
                        <ShieldCheck className="h-3 w-3" />
                        {"Activ\u00e9"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {"Non activ\u00e9"}
                      </span>
                    )}
                  </div>
                </div>

                {!mfaLoading && !mfaEnrolling && !has2FA && (
                  <button
                    type="button"
                    onClick={handleEnable2FA}
                    className="shrink-0 rounded-md bg-white px-4 py-2 text-[13px] font-semibold text-black hover:bg-white/90 transition-colors"
                  >
                    {"Activer le 2FA"}
                  </button>
                )}

                {!mfaLoading && has2FA && !showDisableConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDisableConfirm(true)}
                    className="shrink-0 rounded-md border border-border bg-muted/30 px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    {"D\u00e9sactiver le 2FA"}
                  </button>
                )}
              </div>

              {/* Enrollment flow */}
              {mfaEnrolling && mfaEnrollData && (
                <div className="mt-6 space-y-4 rounded-md border border-border bg-card/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-foreground/90">
                        {"Scannez le QR code avec votre application"}
                      </p>
                      <p className="mt-1 text-[12px] text-muted-foreground/60">
                        {"Google Authenticator, Authy, 1Password..."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEnroll}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted/50"
                      aria-label="Annuler"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {mfaEnrollData.qrCode && (
                    <div className="flex justify-center">
                      <div className="rounded-md bg-white p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mfaEnrollData.qrCode}
                          alt="QR code 2FA"
                          className="h-44 w-44"
                        />
                      </div>
                    </div>
                  )}

                  {mfaEnrollData.secret && (
                    <div className="text-center">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground/50">
                        {"Ou saisissez ce code manuellement"}
                      </p>
                      <code className="mt-1 inline-block rounded bg-muted/40 px-2 py-1 text-[12px] font-mono text-foreground/80">
                        {mfaEnrollData.secret}
                      </code>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>{"Code de v\u00e9rification"}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="one-time-code"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className={`${inputClass} text-center font-mono text-base tracking-[0.5em]`}
                    />
                  </div>

                  {mfaError && (
                    <p className="text-[13px] text-red-400">{mfaError}</p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleVerify2FA}
                      disabled={mfaVerifying || mfaCode.length !== 6}
                      className="rounded-md bg-white px-5 py-2 text-[13px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors"
                    >
                      {mfaVerifying ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {"V\u00e9rification..."}
                        </span>
                      ) : (
                        "V\u00e9rifier"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEnroll}
                      className="text-[13px] text-muted-foreground hover:text-foreground"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Disable confirmation modal */}
              {showDisableConfirm && (
                <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-[13px] font-medium text-foreground/90">
                    {"D\u00e9sactiver le 2FA ?"}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground/70">
                    {"Votre compte sera moins prot\u00e9g\u00e9. Vous pourrez le r\u00e9activer \u00e0 tout moment."}
                  </p>
                  {mfaError && (
                    <p className="mt-2 text-[12px] text-red-400">{mfaError}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDisable2FA}
                      disabled={disabling}
                      className="rounded-md bg-red-500/90 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                    >
                      {disabling ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {"D\u00e9sactivation..."}
                        </span>
                      ) : (
                        "Confirmer"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisableConfirm(false);
                        setMfaError(null);
                      }}
                      className="text-[12px] text-muted-foreground hover:text-foreground"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
