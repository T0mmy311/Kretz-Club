import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@kretz/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(
      getRateLimitKey(request, "upload-attachment"),
      30,
      60 * 60 * 1000
    );
    if (!rateLimit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Trop de requêtes, veuillez patienter" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    // Find the member
    const member = await prisma.member.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const messageId = formData.get("messageId") as string;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    if (!messageId) {
      return NextResponse.json({ error: "messageId requis" }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10MB)" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporte" },
        { status: 400 }
      );
    }

    // Verify the message exists and belongs to the current member
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, authorId: true, channelId: true, conversationId: true },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message introuvable" },
        { status: 404 }
      );
    }

    if (message.authorId !== member.id) {
      return NextResponse.json(
        { error: "Non autorise" },
        { status: 403 }
      );
    }

    // Build storage path
    const folder = message.channelId ?? message.conversationId ?? "unknown";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${folder}/${messageId}/${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("attachments")
      .getPublicUrl(storagePath);

    // Create attachment record in DB
    const attachment = await prisma.attachment.create({
      data: {
        messageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath,
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        storagePath: true,
      },
    });

    return NextResponse.json({
      ...attachment,
      url: urlData.publicUrl,
    });
  } catch (error) {
    console.error("Attachment upload error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
