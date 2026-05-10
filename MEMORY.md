# Kretz Club - Mémoire du projet

> Document de référence pour reprendre le projet à tout moment, même après /clear.

## 🎯 Contexte

App web premium destinée à remplacer le Discord du **Kretz Club** (~600 membres), un club privé d'investissement immobilier français de standing.

- **Repo GitHub** : T0mmy311/Kretz-Club
- **Production** : https://kretz-club.vercel.app
- **Statut** : v3 en prod, en attente de validation par le club avant migration

## 👤 Comptes

### Admins
| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `thomas.jean28@outlook.fr` | `Erokspeiti28@` | Admin (Thomas) |
| `jules.lamothe@kretzclub.com` | `kretz-admin2026` | Admin (Jules) |

### Codes d'invitation actifs (30 jours)
`KRETZ001`, `KRETZ002`, `KRETZ003`, `KRETZ004`, `KRETZ005`, `JULES001`, `DEMO2026`

## 🛠️ Stack technique

- **Framework** : Next.js 16 (App Router, Turbopack)
- **DB** : Supabase Postgres + Prisma ORM
- **Auth** : Supabase Auth (email/password + 2FA optionnel admins)
- **API** : tRPC v11
- **Styling** : Tailwind CSS (theme tokens, dark/light)
- **Realtime** : Supabase Realtime (broadcast + postgres_changes)
- **Storage** : Supabase Storage (buckets `avatars` + `attachments`)
- **Hosting** : Vercel
- **Monorepo** : Turborepo (apps/web + packages/api, db, shared)
- **Monitoring** : Sentry (configuré)

## 🌐 Project IDs

- **Supabase** : `riwfbwtrochnfqoixcco`
  - URL : `https://riwfbwtrochnfqoixcco.supabase.co`
  - Region : `aws-1-eu-west-3` (Paris)
  - DB Password : `Erokspeiti28@` (encodé `Erokspeiti28%40` dans URLs)
- **Sentry** : org `t0mmy311`, project `kretz-club`
- **GitHub** : T0mmy311 (et tjean-projets en collab)

## 📱 Features actuelles (v3)

### Auth & Profil
- Connexion email/password + œil pour voir mdp
- Inscription avec code invitation obligatoire
- Mot de passe oublié (page complète)
- 2FA TOTP optionnel pour admins
- Profil : prénom, nom, profession, bio, entreprise, téléphone, ville, LinkedIn, photo, date de naissance, tags
- Onboarding 7 étapes avec photo obligatoire à la fin

### Messagerie
- 11 channels groupés en 4 catégories (Le Cercle, Le Grand Salon, Thématiques, Aide)
- Messages privés (DM)
- Réactions emojis
- Édition / suppression de ses messages
- Réponses (parent/child)
- Mentions @ (backend)
- Indicateur "X est en train d'écrire..."
- Upload images/PDF/Word (10 MB max)
- Avatars partout
- Recherche dans les messages (Cmd+K)
- Sondages (admin only) affichés en haut des channels
- Notifications navigateur + son quand tab inactif

### Investissements
- Liste avec filtres (Tous/Ouverts/Financés/Clôturés)
- Vue Liste / Carte (Mapbox - token à configurer)
- Page détail avec deck PDF, exprimer intérêt, retirer
- Portfolio personnel avec ROI graphique
- Co-investissement (avatars empilés si ≥2 investisseurs)

### Événements
- Vue Liste / Calendrier mensuel
- Page détail avec inscription, calendrier ICS
- Stripe Checkout (prêt mais pas configuré)
- Cover photos sur tous les events

### Annuaire
- 22 membres de démo, recherche, filtres (ville, métier, tags)
- Page détail membre avec recommandations
- Pagination "Charger plus"

### Galerie
- 3 albums avec photos, lightbox
- Liée aux événements

### Factures
- Liste payées/en attente
- Export CSV des events participés
- Auto-créées au paiement Stripe

### Admin (uniquement Thomas + Jules)
- Tableau de bord
- Membres : activer/désactiver, promouvoir/rétrograder admin
- Invitations : créer/supprimer codes
- Audit logs : toutes les actions admin tracées
- Investissements CRUD complet
- Événements CRUD complet
- Channels : créer/éditer/supprimer
- Galerie : albums + photos
- Modération messages (supprimer/épingler n'importe lequel)
- Stats par channel (messages, top contributeurs)
- Sondages : créer dans n'importe quel channel

### Autres
- Mode sombre/clair persisté en BDD
- Skeleton loaders premium partout
- Optimistic updates messages
- Cache tRPC 1 min, prefetch hover
- PWA installable
- Charte du club page
- Email digest hebdomadaire (cron lundi 9h, à activer avec Resend)

## ⚙️ Variables d'environnement

### Supabase (✅ configuré sur Vercel)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (avec `%40` pour `@`)
- `DIRECT_URL`

### Sentry (✅ configuré sur Vercel)
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_ORG=t0mmy311`
- `SENTRY_PROJECT=kretz-club`
- `SENTRY_AUTH_TOKEN`

### À configurer plus tard (quand validé par le club)
- `RESEND_API_KEY` — pour les emails (digest hebdo, magic link)
- `NEXT_PUBLIC_MAPBOX_TOKEN` — pour la carte des deals
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `CRON_SECRET` — pour sécuriser le cron Vercel

## 🚀 Roadmap (ordre de priorité)

### Phase 2 — En cours d'ajout
- [ ] Profil enrichi : réseaux sociaux (LinkedIn, Instagram, site web)
- [ ] Channel "Marketplace" pour services entre membres
- [ ] Channel "Mentorat" pour matching senior/junior
- [ ] Page bibliothèque de ressources (vidéos, articles, ebooks)
- [ ] Page replays vidéos d'événements

### Phase 3 — Quand le club valide
- [ ] App native iOS/Android (Expo + React Native)
- [ ] Mode hors-ligne (PWA caching avancé)
- [ ] Multi-langue FR/EN
- [ ] Domaine custom (app.kretzclub.com)
- [ ] Plan Supabase Pro ($25/mois)
- [ ] Resend SMTP (3K emails/mois gratuit)
- [ ] Mapbox token (gratuit 50K vues/mois)

### Phase 4 — Plus tard
- Co-investissement formalisé (groupes + docs)
- Signature électronique (DocuSign/Yousign)
- Système de points/badges
- Dashboard ROI consolidé
- Webinaires intégrés (LiveKit/Daily.co)

## 🐛 Bugs connus / Points d'attention

- Le son de notif (`/sounds/notification.mp3`) est un placeholder silencieux 250ms — à remplacer
- Mapbox/Stripe/Resend/Anthropic en mode "graceful fallback" tant que pas configurés
- Le cron Vercel pour digest hebdo nécessite `CRON_SECRET` à générer

## 📝 Conventions du projet

- Texte UI en français
- Toasts sonner pour les confirmations
- Confirmation modals pour les actions destructives
- AuditLog pour toutes les actions admin
- Theme tokens (`text-foreground`, `bg-card`) pas de couleurs hardcodées
- Zod validators dans `packages/shared`
- adminProcedure pour les mutations admin
- Fail-silent sur les services externes optionnels
