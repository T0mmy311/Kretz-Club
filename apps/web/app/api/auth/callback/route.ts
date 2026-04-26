import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@kretz/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data?.user) {
      const user = data.user;
      const email = user.email ?? "";
      const metadata = (user.user_metadata ?? {}) as {
        first_name?: string;
        last_name?: string;
        invite_code?: string;
      };

      // Find or create the member
      let member = await prisma.member.findUnique({
        where: { supabaseAuthId: user.id },
      });

      if (!member) {
        const fallbackParts = email.split("@")[0].split(".");
        member = await prisma.member.create({
          data: {
            supabaseAuthId: user.id,
            email,
            firstName: metadata.first_name ?? fallbackParts[0] ?? "Membre",
            lastName: metadata.last_name ?? fallbackParts[1] ?? "Kretz",
          },
        });
      }

      // Consume invitation if one was attached during signup
      const inviteCode = metadata.invite_code;
      if (inviteCode) {
        try {
          const invitation = await prisma.invitation.findUnique({
            where: { code: inviteCode },
          });

          if (
            invitation &&
            !invitation.usedAt &&
            new Date(invitation.expiresAt) > new Date()
          ) {
            await prisma.invitation.update({
              where: { code: inviteCode },
              data: {
                usedById: member.id,
                usedAt: new Date(),
              },
            });
          }
        } catch (err) {
          console.error("Error consuming invitation in callback:", err);
        }
      }

      // Auto-join the member to ALL channels (idempotent)
      try {
        const channels = await prisma.channel.findMany({ select: { id: true } });
        if (channels.length > 0) {
          await prisma.channelMember.createMany({
            data: channels.map((c) => ({
              channelId: c.id,
              memberId: member.id,
            })),
            skipDuplicates: true,
          });
        }
      } catch (err) {
        console.error("Error auto-joining channels in callback:", err);
      }
    }
  }

  return NextResponse.redirect(new URL("/messagerie", request.url));
}
