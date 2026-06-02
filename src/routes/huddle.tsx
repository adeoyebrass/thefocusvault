import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { VaultNav } from "@/components/VaultNav";
import { useVaultConfig, focusHours } from "@/lib/vault-config";
import { supabase } from "@/integrations/supabase/client";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export const Route = createFileRoute("/huddle")({
  component: HuddlePage,
  head: () => ({
    meta: [
      { title: "Pre-Lock Huddle · The Focus Vault" },
      { name: "description", content: "2-minute focus contracting with the Vault's AI planner." },
    ],
  }),
});

function HuddlePage() {
  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: { mode: "huddle" },
    headers: authHeaders,
  });
  const { messages, sendMessage, status } = useChat({ id: "huddle", transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);
  useEffect(() => { inputRef.current?.focus(); }, [status]);

  const busy = status === "submitted" || status === "streaming";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  };

  // seed with operator opener
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage({ text: "Start the huddle. Ask me what I'm shipping today." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-12">
        <aside className="md:col-span-4">
          <div className="label mb-2">§ PHASE 01</div>
          <h1 className="font-display text-4xl font-bold leading-tight">PRE-LOCK<br/>HUDDLE.</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            You have 2 minutes. State the objective. The Contracting Agent will interrogate it
            until it's defensible, then forge it into a 09:00–17:00 timeline pinned to your
            lock screen.
          </p>
          <FocusWindowEditor />
          <div className="mt-6 brutal-card p-4">
            <div className="label mb-2">STATUS</div>
            <div className="mono text-sm">
              <div className="flex justify-between"><span>AGENT</span><span className="stakes-amber">ONLINE</span></div>
              <div className="flex justify-between"><span>TURNS</span><span>{messages.filter(m => m.role === "user").length}</span></div>
              <div className="flex justify-between"><span>LOCK IN</span><span><LockStartLabel /></span></div>
            </div>
          </div>
          <Link to="/lock" className="mt-6 block label hover:text-foreground">→ skip to lock demo</Link>
        </aside>

        <section className="md:col-span-8">
          <div className="brutal-card flex h-[70vh] flex-col">
            <div className="brutal-border border-x-0 border-t-0 px-5 py-3 flex items-center justify-between">
              <div className="label">CONTRACTING AGENT · gemini-3-flash</div>
              <span className={`mono text-xs ${busy ? "stakes-amber pulse-stakes" : "text-muted-foreground"}`}>
                {busy ? "● TRANSMITTING" : "● IDLE"}
              </span>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-5">
              {messages.map((m) => {
                const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
                if (m.role === "user") {
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[80%] brutal-border bg-secondary px-4 py-2.5 text-sm">
                        {text}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={m.id} className="max-w-[90%]">
                    <div className="label mb-1">VAULT//AGENT</div>
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-table:mono prose-table:text-xs prose-th:border prose-th:border-border prose-th:px-2 prose-th:py-1 prose-td:border prose-td:border-border prose-td:px-2 prose-td:py-1">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}
              {busy && messages[messages.length - 1]?.role === "user" && (
                <div className="label pulse-stakes">VAULT//AGENT · thinking</div>
              )}
            </div>

            <form onSubmit={onSubmit} className="brutal-border border-x-0 border-b-0 p-3">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) onSubmit(e as unknown as React.FormEvent);
                  }}
                  rows={2}
                  placeholder="State the deliverable. Be specific."
                  className="flex-1 resize-none bg-background brutal-border p-3 text-sm font-mono outline-none focus:ring-amber"
                  disabled={busy}
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="brutal-border bg-foreground px-5 mono text-xs font-bold uppercase tracking-widest text-background disabled:opacity-40"
                >
                  SEND
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function FocusWindowEditor() {
  const [cfg, update] = useVaultConfig();
  const hours = focusHours(cfg.startTime, cfg.endTime);
  const teamMode = cfg.members.length > 0;
  const canEdit = !teamMode || cfg.isLead;
  return (
    <div className="mt-8 brutal-card p-4 ring-amber">
      <div className="label mb-3 flex items-center justify-between">
        <span>FOCUS WINDOW</span>
        <span className="stakes-amber">{hours.toFixed(1)} h</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">START</span>
          <input
            type="time"
            value={cfg.startTime}
            disabled={!canEdit}
            onChange={(e) => update({ startTime: e.target.value })}
            className="mt-1 w-full brutal-border bg-background px-2 py-1.5 mono text-sm outline-none disabled:opacity-50"
          />
        </label>
        <label>
          <span className="label">END</span>
          <input
            type="time"
            value={cfg.endTime}
            disabled={!canEdit}
            onChange={(e) => update({ endTime: e.target.value })}
            className="mt-1 w-full brutal-border bg-background px-2 py-1.5 mono text-sm outline-none disabled:opacity-50"
          />
        </label>
      </div>
      <p className="mt-3 mono text-[10px] text-muted-foreground">
        {teamMode
          ? canEdit
            ? `Team mode · you're the lead. This locks ${cfg.members.length} operators.`
            : "Team mode · only the lead can change the window."
          : "Solo mode · this is your block today."}
      </p>
    </div>
  );
}

function LockStartLabel() {
  const [cfg] = useVaultConfig();
  return <>{cfg.startTime}</>;
}
