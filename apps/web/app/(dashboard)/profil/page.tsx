"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Camera, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function ProfilPage() {
  const { data: profile, isLoading } = trpc.member.me.useQuery();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = trpc.member.updateProfile.useMutation({
    onSuccess: () => {
      utils.member.me.invalidate();
      utils.member.list.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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

  const inputClass = "mt-1.5 block w-full rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-[14px] text-white placeholder:text-white/20 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors";
  const labelClass = "block text-[12px] font-medium text-white/50 uppercase tracking-wider";

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
        <h2 className="text-xl font-semibold text-white">Mon profil</h2>
        <p className="mt-1 text-[13px] text-white/40">
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
              className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/[0.08] transition-colors hover:bg-white/[0.12]"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-semibold text-white/50">{getInitials()}</span>
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
            <p className="text-[14px] font-medium text-white/80">Photo de profil</p>
            <p className="text-[12px] text-white/30">JPG, PNG ou WebP. Max 2MB.</p>
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

            {saved && (
              <span className="text-[13px] text-green-400 animate-fade-in">
                {"Profil mis \u00e0 jour \u2713"}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
