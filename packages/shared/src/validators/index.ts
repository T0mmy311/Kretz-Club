import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
});

// Member profile
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  profession: z.string().optional(),
  bio: z.string().max(500, "Bio trop longue").optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  linkedinUrl: z.string().url("URL LinkedIn invalide").optional().or(z.literal("")),
});

// Messages
export const sendMessageSchema = z.object({
  channelId: z.string().uuid().optional(),
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1, "Message vide").max(4000, "Message trop long"),
  parentId: z.string().uuid().optional(),
});

// Investments
export const createInvestmentSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  location: z.string().optional(),
  targetAmount: z.number().positive("Montant positif requis").optional(),
  minimumTicket: z.number().positive("Montant positif requis").optional(),
});

export const expressInterestSchema = z.object({
  investmentId: z.string().uuid(),
  amount: z.number().positive("Montant positif requis").optional(),
  notes: z.string().max(1000).optional(),
});

// Events
export const createEventSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  price: z.number().min(0).default(0),
  maxAttendees: z.number().int().positive().optional(),
});

// Recommendations
export const createRecommendationSchema = z.object({
  toMemberId: z.string().uuid(),
  content: z.string().min(10, "Recommandation trop courte").max(1000, "Recommandation trop longue"),
  isPublic: z.boolean().default(true),
});

// Pagination
export const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// Search
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
});
