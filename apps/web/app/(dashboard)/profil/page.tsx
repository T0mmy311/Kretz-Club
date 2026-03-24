"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function ProfilPage() {
  const { data: profile, isLoading } = trpc.member.me.useQuery();
  const utils = trpc.useUtils();

  const updateProfile = trpc.member.updateProfile.useMutation({
    onSuccess: () => {
      utils.member.me.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const [saved, setSaved] = useState(false);
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
      const p = profile as {
        firstName?: string;
        lastName?: string;
        profession?: string;
        bio?: string;
        company?: string;
        phone?: string;
        city?: string;
        linkedinUrl?: string;
      };
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Mon profil</h2>
        <p className="mt-1 text-muted-foreground">
          Mettez a jour vos informations personnelles
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Prenom</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Nom</label>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Profession</label>
          <input
            name="profession"
            value={form.profession}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Entreprise</label>
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Telephone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            type="tel"
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Ville</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Paris, Lyon, Marseille..."
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">LinkedIn</label>
          <input
            name="linkedinUrl"
            value={form.linkedinUrl}
            onChange={handleChange}
            type="url"
            placeholder="https://linkedin.com/in/..."
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateProfile.isPending
              ? "Enregistrement..."
              : "Enregistrer"}
          </button>

          {saved && (
            <span className="text-sm text-green-600">
              Profil mis a jour avec succes
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
