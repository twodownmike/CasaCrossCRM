"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { chatTime } from "@/lib/format";
import { sendMessage } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

export function ChatPanel({
  eventId,
  messages: initial,
}: {
  eventId: string;
  messages: Message[];
}) {
  const [messages, setMessages] = useState(initial);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const meRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      meRef.current = data.user?.id ?? null;
    });
    const channel = supabase
      .channel(`messages:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Message).id)
              ? prev
              : [...prev, payload.new as Message],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    const f = new FormData();
    f.set("event_id", eventId);
    f.set("text", value);
    start(() => sendMessage(f));
  }

  return (
    <div
      className="fade-in"
      style={{
        padding: "var(--s-5)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 240,
        }}
      >
        {messages.length === 0 && (
          <div className="muted" style={{ fontSize: 13, textAlign: "center" }}>
            No messages yet — say hi to your team.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id && m.sender_id === meRef.current;
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: mine ? "flex-end" : "flex-start",
              }}
            >
              <div style={{ maxWidth: "78%" }}>
                {!mine && m.sender_name && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-4)",
                      marginBottom: 3,
                      marginLeft: 12,
                    }}
                  >
                    {m.sender_name} · {chatTime(m.created_at)}
                  </div>
                )}
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: mine
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                    background: mine ? "var(--ink)" : "var(--hair-2)",
                    color: mine ? "white" : "var(--ink)",
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {m.text}
                </div>
                {mine && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-4)",
                      marginTop: 3,
                      textAlign: "right",
                      marginRight: 4,
                    }}
                  >
                    {chatTime(m.created_at)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={submit}
        style={{ display: "flex", gap: 8, marginTop: 8, paddingBottom: 8 }}
      >
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the team…"
        />
        <button
          className="btn primary"
          style={{ padding: "12px 14px" }}
          type="submit"
          disabled={pending}
        >
          <Icon.send />
        </button>
      </form>
    </div>
  );
}
