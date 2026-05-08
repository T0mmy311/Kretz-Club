"use client";

import { useState, useRef, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  Send,
  Hash,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
  SmilePlus,
  X,
  Reply,
  Check,
  Paperclip,
  FileText,
  Download,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";

// ---- helpers ----------------------------------------------------------------

function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(date: Date | string) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Aujourd\u2019hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function truncate(text: string, max = 60) {
  return text.length > max ? text.slice(0, max) + "\u2026" : text;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getAttachmentUrl(storagePath: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/attachments/${storagePath}`;
}

function isImageType(fileType: string) {
  return fileType.startsWith("image/");
}

const EMOJI_LIST = ["\ud83d\udc4d", "\u2764\ufe0f", "\ud83d\ude02", "\ud83d\udd25", "\ud83d\udc4f", "\ud83c\udf89", "\ud83d\udcaf", "\ud83d\ude2e"];

// ---- types ------------------------------------------------------------------

type ReactionRaw = { id: string; emoji: string; memberId: string };

type AttachmentItem = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
};

type MessageItem = {
  id: string;
  content: string;
  channelId: string | null;
  conversationId: string | null;
  parentId: string | null;
  isEdited: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  author: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  parent?: {
    id: string;
    content: string;
    author: { id: string; firstName: string; lastName: string };
  } | null;
  reactions: ReactionRaw[];
  attachments: AttachmentItem[];
  _count: { replies: number };
};

// ---- sub-components ---------------------------------------------------------

function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 z-50 mb-1 flex gap-1 rounded-lg border border-border bg-card p-1.5 shadow-lg"
    >
      {EMOJI_LIST.map((e) => (
        <button
          key={e}
          onClick={() => onSelect(e)}
          className="rounded p-1 text-base hover:bg-muted/60"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function ReactionPills({
  reactions,
  currentMemberId: myId,
  onToggle,
}: {
  reactions: ReactionRaw[];
  currentMemberId: string;
  onToggle: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;

  // group by emoji
  const grouped: Record<string, { count: number; mine: boolean }> = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, mine: false };
    grouped[r.emoji].count++;
    if (r.memberId === myId) grouped[r.emoji].mine = true;
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {Object.entries(grouped).map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            mine
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
          }`}
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </button>
      ))}
    </div>
  );
}

function MessageActions({
  isAuthor,
  onReply,
  onEdit,
  onDelete,
  onReaction,
}: {
  isAuthor: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReaction: () => void;
}) {
  return (
    <div className="absolute -top-3 right-2 z-10 hidden gap-0.5 rounded-md border border-border bg-card p-0.5 shadow-md group-hover:flex">
      <button
        onClick={onReply}
        title="R\u00e9pondre"
        className="rounded p-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        <Reply className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onReaction}
        title="R\u00e9action"
        className="rounded p-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
      >
        <SmilePlus className="h-3.5 w-3.5" />
      </button>
      {isAuthor && (
        <>
          <button
            onClick={onEdit}
            title="Modifier"
            className="rounded p-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            title="Supprimer"
            className="rounded p-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

// ---- main page --------------------------------------------------------------

export default function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = use(params);

  // -- state ------------------------------------------------------------------
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: string;
    authorName: string;
    content: string;
  } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { name: string; timeout: ReturnType<typeof setTimeout> }>
  >(new Map());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryMessageCount, setSummaryMessageCount] = useState<number | null>(null);

  const fetchSummary = async () => {
    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummaryError(null);
    setSummaryText(null);
    try {
      const res = await fetch(`/api/channel/${channelId}/summary`);
      const json = await res.json();
      if (!res.ok) {
        setSummaryError(json.error || "Erreur lors de la génération du résumé");
      } else {
        setSummaryText(json.summary || "");
        setSummaryMessageCount(json.messageCount ?? null);
      }
    } catch (err) {
      console.error(err);
      setSummaryError("Erreur réseau");
    } finally {
      setSummaryLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseBroadcastRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  // -- queries ----------------------------------------------------------------
  const { data: meData } = trpc.member.me.useQuery();
  const myId = (meData as any)?.id as string | undefined;

  const { data: channelsByCategory } = trpc.channel.list.useQuery();
  const currentChannel = channelsByCategory
    ? Object.values(channelsByCategory)
        .flat()
        .find((ch: any) => ch.id === channelId)
    : null;

  const {
    data: messagesData,
    isLoading,
    refetch,
  } = trpc.message.list.useQuery({ channelId }, { enabled: !!channelId });

  const utils = trpc.useUtils();

  // -- mutations --------------------------------------------------------------
  const sendMessage = trpc.message.send.useMutation({
    onSuccess: async (data) => {
      setContent("");
      setReplyTo(null);

      // If there is a file, upload it with the message ID
      if (selectedFile) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("messageId", data.id);
          await fetch("/api/upload-attachment", {
            method: "POST",
            body: formData,
          });
        } catch (err) {
          console.error("Attachment upload failed:", err);
          toast.error("Erreur lors de l'envoi du fichier");
        } finally {
          setSelectedFile(null);
          setIsUploading(false);
        }
      }

      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de l'envoi du message");
    },
  });

  const editMessage = trpc.message.edit.useMutation({
    onSuccess: () => {
      setEditingMessage(null);
      setContent("");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la modification");
    },
  });

  const deleteMessage = trpc.message.delete.useMutation({
    onSuccess: () => {
      setConfirmDeleteId(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la suppression");
    },
  });

  const toggleReaction = trpc.reaction.toggle.useMutation({
    onSuccess: () => refetch(),
  });

  // -- mark channel read ------------------------------------------------------
  const markRead = trpc.channel.markRead.useMutation();
  useEffect(() => {
    if (channelId) markRead.mutate({ channelId });
    inputRef.current?.focus();
  }, [channelId]);

  // -- Supabase Realtime: messages + typing -----------------------------------
  useEffect(() => {
    const supabase = createClient();

    // Postgres changes for new messages
    const pgChannel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        () => refetch()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        () => refetch()
      )
      .subscribe();

    // Broadcast channel for typing indicator
    const broadcastChannel = supabase.channel(`typing:${channelId}`);
    broadcastChannel
      .on("broadcast", { event: "typing" }, (payload: any) => {
        const { memberId, memberName } = payload.payload ?? {};
        if (!memberId || memberId === myId) return;
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const existing = next.get(memberId);
          if (existing) clearTimeout(existing.timeout);
          const timeout = setTimeout(() => {
            setTypingUsers((p) => {
              const n = new Map(p);
              n.delete(memberId);
              return n;
            });
          }, 3000);
          next.set(memberId, { name: memberName, timeout });
          return next;
        });
      })
      .subscribe();

    supabaseBroadcastRef.current = broadcastChannel;

    return () => {
      supabase.removeChannel(pgChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [channelId, refetch, myId]);

  // -- scroll to bottom -------------------------------------------------------
  useEffect(() => {
    // If a hash targets a specific message, don't auto-scroll to bottom.
    if (typeof window !== "undefined" && window.location.hash.startsWith("#message-")) {
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  // -- scroll to message from URL hash + flash highlight ----------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!messagesData?.messages || messagesData.messages.length === 0) return;

    const hash = window.location.hash;
    if (!hash.startsWith("#message-")) return;

    const messageId = hash.replace("#message-", "");
    if (!messageId) return;

    // Wait briefly for the DOM to render the messages list
    const t = setTimeout(() => {
      const el = document.getElementById(`message-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedMessageId(messageId);
        setTimeout(() => setHighlightedMessageId(null), 2000);
      }
    }, 100);

    return () => clearTimeout(t);
  }, [messagesData?.messages, channelId]);

  // -- handlers ---------------------------------------------------------------
  const broadcastTyping = useCallback(() => {
    if (!myId || !meData) return;
    supabaseBroadcastRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: {
        memberId: myId,
        memberName: `${(meData as any).firstName}`,
      },
    });
  }, [myId, meData]);

  const handleSend = () => {
    if (!content.trim() && !selectedFile) return;

    if (editingMessage) {
      if (!content.trim()) return;
      editMessage.mutate({
        messageId: editingMessage.id,
        content: content.trim(),
      });
    } else {
      sendMessage.mutate({
        channelId,
        content: content.trim() || "\u200B",
        ...(replyTo ? { parentId: replyTo.id } : {}),
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (editingMessage) {
        setEditingMessage(null);
        setContent("");
      }
      if (replyTo) {
        setReplyTo(null);
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // debounced typing broadcast
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(broadcastTyping, 300);
  };

  const startEdit = (msg: MessageItem) => {
    setEditingMessage({ id: msg.id, content: msg.content });
    setContent(msg.content);
    setReplyTo(null);
    inputRef.current?.focus();
  };

  const startReply = (msg: MessageItem) => {
    setReplyTo({
      id: msg.id,
      authorName: `${msg.author.firstName} ${msg.author.lastName}`,
      content: msg.content,
    });
    setEditingMessage(null);
    setContent("");
    inputRef.current?.focus();
  };

  const handleReaction = (messageId: string, emoji: string) => {
    toggleReaction.mutate({ messageId, emoji });
    setEmojiPickerMsgId(null);
  };

  // -- derived data -----------------------------------------------------------
  const allMessages = [...((messagesData?.messages ?? []) as MessageItem[])].reverse();
  const messageGroups: { date: string; messages: typeof allMessages }[] = [];
  let currentDate = "";
  for (const msg of allMessages) {
    const dateStr = formatDateLabel(msg.createdAt);
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      messageGroups.push({ date: dateStr, messages: [] });
    }
    messageGroups[messageGroups.length - 1].messages.push(msg);
  }

  const ch = currentChannel as any;
  const typingNames = Array.from(typingUsers.values()).map((t) => t.name);

  // -- render -----------------------------------------------------------------
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link href="/messagerie" className="rounded-md p-1 hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Hash className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">{ch?.displayName ?? "Channel"}</h2>
        <button
          onClick={fetchSummary}
          disabled={summaryLoading}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-600 transition-colors hover:bg-yellow-500/20 disabled:opacity-50"
          title="Générer un résumé IA des derniers messages"
        >
          {summaryLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {"Résumé IA"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Hash className="h-12 w-12 opacity-20" />
            <p className="mt-4 text-lg font-medium">
              {"Bienvenue dans #"}
              {ch?.displayName ?? "ce channel"}
            </p>
            <p className="mt-1 text-sm">
              {"Soyez le premier \u00e0 envoyer un message !"}
            </p>
          </div>
        ) : (
          <div className="py-4">
            {messageGroups.map((group) => (
              <div key={group.date}>
                <div className="relative my-4 flex items-center px-4">
                  <div className="flex-1 border-t" />
                  <span className="mx-4 text-xs font-medium text-muted-foreground">
                    {group.date}
                  </span>
                  <div className="flex-1 border-t" />
                </div>
                {group.messages.map((msg) => {
                  const initials = `${msg.author.firstName[0]}${msg.author.lastName[0]}`.toUpperCase();
                  const isAuthor = myId === msg.author.id;

                  return (
                    <div
                      key={msg.id}
                      id={`message-${msg.id}`}
                      className={`group relative flex items-start gap-3 px-4 py-1.5 hover:bg-muted/30 transition-colors duration-700 ${
                        highlightedMessageId === msg.id
                          ? "bg-yellow-500/20 hover:bg-yellow-500/20"
                          : ""
                      }`}
                    >
                      {/* Hover action bar */}
                      <MessageActions
                        isAuthor={isAuthor}
                        onReply={() => startReply(msg)}
                        onEdit={() => startEdit(msg)}
                        onDelete={() => setConfirmDeleteId(msg.id)}
                        onReaction={() =>
                          setEmojiPickerMsgId(
                            emojiPickerMsgId === msg.id ? null : msg.id
                          )
                        }
                      />

                      {/* Emoji picker popover */}
                      {emojiPickerMsgId === msg.id && (
                        <div className="absolute -top-10 right-2 z-50">
                          <EmojiPicker
                            onSelect={(emoji) => handleReaction(msg.id, emoji)}
                            onClose={() => setEmojiPickerMsgId(null)}
                          />
                        </div>
                      )}

                      {/* Avatar */}
                      {msg.author.avatarUrl ? (
                        <img
                          src={msg.author.avatarUrl}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {initials}
                        </div>
                      )}

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Reply indicator */}
                        {msg.parent && (
                          <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Reply className="h-3 w-3" />
                            <span className="font-medium">
                              {msg.parent.author.firstName}{" "}
                              {msg.parent.author.lastName}
                            </span>
                            <span className="truncate opacity-70">
                              {truncate(msg.parent.content, 50)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">
                            {msg.author.firstName} {msg.author.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.createdAt)}
                          </span>
                          {msg.isEdited && (
                            <span className="text-xs text-muted-foreground">
                              {"(modifi\u00e9)"}
                            </span>
                          )}
                        </div>
                        {msg.content && msg.content !== "\u200B" && (
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {msg.content}
                          </p>
                        )}

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((att) => {
                              const url = getAttachmentUrl(att.storagePath);
                              if (isImageType(att.fileType)) {
                                return (
                                  <button
                                    key={att.id}
                                    onClick={() => setFullscreenImage(url)}
                                    className="block"
                                  >
                                    <img
                                      src={url}
                                      alt={att.fileName}
                                      className="max-h-[300px] rounded-lg border border-border/50 object-contain"
                                    />
                                  </button>
                                );
                              }
                              return (
                                <a
                                  key={att.id}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 hover:bg-muted/50 transition-colors"
                                >
                                  <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{att.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
                                  </div>
                                  <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Reaction pills */}
                        {myId && (
                          <ReactionPills
                            reactions={msg.reactions}
                            currentMemberId={myId}
                            onToggle={(emoji) => handleReaction(msg.id, emoji)}
                          />
                        )}
                      </div>

                      {/* Delete confirmation dialog */}
                      {confirmDeleteId === msg.id && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
                            <span className="text-sm">
                              Supprimer ce message ?
                            </span>
                            <button
                              onClick={() =>
                                deleteMessage.mutate({ messageId: msg.id })
                              }
                              disabled={deleteMessage.isPending}
                              className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {deleteMessage.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Supprimer"
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:text-foreground/80"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="px-4 py-1">
          <p className="text-xs text-muted-foreground italic">
            {typingNames.length === 1
              ? `${typingNames[0]} est en train d\u2019\u00e9crire\u2026`
              : `${typingNames.join(", ")} sont en train d\u2019\u00e9crire\u2026`}
          </p>
        </div>
      )}

      {/* Composer */}
      {!ch?.isReadOnly && (
        <div className="border-t p-4">
          {/* Reply bar */}
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
              <Reply className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">
                {"R\u00e9ponse \u00e0 "}
                <span className="font-medium text-foreground">
                  {replyTo.authorName}
                </span>
                {" : "}
                {truncate(replyTo.content, 80)}
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="ml-auto shrink-0 text-muted-foreground/80 hover:text-foreground/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Editing bar */}
          {editingMessage && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
              <Pencil className="h-3 w-3 shrink-0 text-primary" />
              <span className="text-muted-foreground">
                Modification du message
              </span>
              <button
                onClick={() => {
                  setEditingMessage(null);
                  setContent("");
                }}
                className="ml-auto shrink-0 text-muted-foreground/80 hover:text-foreground/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* File preview */}
          {selectedFile && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
              {selectedFile.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
            />
            {!editingMessage && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Joindre un fichier"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            )}
            <textarea
              ref={inputRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder={
                editingMessage
                  ? "Modifier le message\u2026"
                  : `\u00c9crire un message dans #${ch?.displayName ?? "channel"}\u2026`
              }
              rows={1}
              className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleSend}
              disabled={
                (!content.trim() && !selectedFile) ||
                sendMessage.isPending ||
                editMessage.isPending ||
                isUploading
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              title={editingMessage ? "Modifier" : "Envoyer"}
            >
              {sendMessage.isPending || editMessage.isPending || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingMessage ? (
                <Check className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* AI Summary modal */}
      {summaryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSummaryOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSummaryOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground/80"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500/15">
                <Sparkles className="h-4 w-4 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Résumé IA</h3>
                {summaryMessageCount !== null && !summaryLoading && !summaryError && (
                  <p className="text-xs text-muted-foreground">
                    Basé sur les {summaryMessageCount} derniers messages
                  </p>
                )}
              </div>
            </div>

            {summaryLoading ? (
              <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération du résumé en cours…
              </div>
            ) : summaryError ? (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm text-red-400">
                {summaryError}
              </div>
            ) : summaryText ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {summaryText}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Fullscreen image overlay */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={fullscreenImage}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
