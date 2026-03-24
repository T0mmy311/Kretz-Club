import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "@kretz/db";
import type { Member } from "@kretz/db";

export interface Context {
  member: Member | null;
  supabaseUserId: string | null;
}

export function createContext(opts: {
  supabaseUserId: string | null;
}): Context {
  return {
    member: null,
    supabaseUserId: opts.supabaseUserId,
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.supabaseUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Non connecté" });
  }

  const member = await prisma.member.findUnique({
    where: { supabaseAuthId: ctx.supabaseUserId },
  });

  if (!member || !member.isActive) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Membre non trouvé ou désactivé",
    });
  }

  return next({ ctx: { ...ctx, member } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.supabaseUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const member = await prisma.member.findUnique({
    where: { supabaseAuthId: ctx.supabaseUserId },
  });

  if (!member?.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accès réservé aux administrateurs",
    });
  }

  return next({ ctx: { ...ctx, member } });
});

export const adminProcedure = t.procedure.use(isAdmin);
