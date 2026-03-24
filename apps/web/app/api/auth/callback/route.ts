import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@kretz/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Auto-create member on first login
    if (data?.user) {
      const existing = await prisma.member.findUnique({
        where: { supabaseAuthId: data.user.id },
      });

      if (!existing) {
        const email = data.user.email ?? "";
        const nameParts = email.split("@")[0].split(".");
        await prisma.member.create({
          data: {
            supabaseAuthId: data.user.id,
            email,
            firstName: nameParts[0] ?? "Membre",
            lastName: nameParts[1] ?? "Kretz",
          },
        });
      }
    }
  }

  return NextResponse.redirect(new URL("/messagerie", request.url));
}
