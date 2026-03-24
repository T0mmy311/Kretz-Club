export const CHANNEL_CATEGORIES = {
  le_cercle: "Le Cercle",
  le_grand_salon: "Le Grand Salon",
  thematiques: "Thématiques",
  aide: "Aide",
} as const;

export type ChannelCategoryKey = keyof typeof CHANNEL_CATEGORIES;

export const DEAL_STATUS_LABELS = {
  draft: "Brouillon",
  open: "Ouvert",
  funding: "En financement",
  funded: "Financé",
  closed: "Clôturé",
  cancelled: "Annulé",
} as const;

export const EVENT_STATUS_LABELS = {
  draft: "Brouillon",
  published: "Publié",
  sold_out: "Complet",
  past: "Passé",
  cancelled: "Annulé",
} as const;

export const INTEREST_STATUS_LABELS = {
  interested: "Intéressé",
  committed: "Engagé",
  invested: "Investi",
  withdrawn: "Retiré",
} as const;

export const APP_NAME = "Kretz Club";

export const MESSAGES_PER_PAGE = 50;
export const MEMBERS_PER_PAGE = 20;
export const EVENTS_PER_PAGE = 12;
export const INVESTMENTS_PER_PAGE = 12;
