"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Spinner } from "@/components/Spinner";

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

const POLL_MS = 3000;

function timeOf(iso: string): string {
  const d = new Date(iso);
  // Aujourd'hui : juste l'heure ; sinon : date + heure.
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  return d.toLocaleString("fr-FR", {
    ...(sameDay ? {} : { day: "numeric", month: "short" }),
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationThread({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const url = `/api/conversations/${conversationId}/messages`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Message[] };
      setMessages((prev) =>
        prev.length === data.messages.length &&
        prev[prev.length - 1]?.id === data.messages[data.messages.length - 1]?.id
          ? prev
          : data.messages,
      );
    } catch {
      // réseau : on réessaiera au prochain tick
    } finally {
      setLoaded(true);
    }
  }, [url]);

  // Chargement initial + polling.
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Auto-scroll en bas à chaque nouveau message.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput("");
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl panel">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {!loaded ? (
          <div className="flex h-full items-center justify-center gap-2 font-mono text-xs text-slate-500">
            <Spinner className="h-5 w-5" /> Chargement des messages…
          </div>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center font-mono text-xs text-slate-600">
            Aucun message. Démarrez la conversation 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "bg-emerald-400 text-emerald-950"
                      : "bg-white/5 text-slate-200 ring-1 ring-white/10"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <span className={`mt-1 block text-right font-mono text-[10px] ${mine ? "text-emerald-900/70" : "text-slate-500"}`}>
                    {timeOf(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrire un message…"
          maxLength={2000}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
