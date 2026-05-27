import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import { createVote } from "@/lib/vault-server.functions";
import breakGlassImage from "@/assets/break-glass.jpg";

export const Route = createFileRoute("/break-glass")({
  component: BreakGlassPage,
  head: () => ({ meta: [{ title: "Break Glass · The Focus Vault" }] }),
});

type Step = "fine" | "reason" | "screening" | "dispatched";

function BreakGlassPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  const [step, setStep] = useState<Step>("fine");
  const [reason, setReason] = useState("");
  const [briefing, setBriefing] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [voteId, setVoteId] = useState<string | null>(null);
  const createVoteFn = useServerFn(createVote);

  async function dispatch() {
    setStep("screening");
    setStreaming(true);
    setBriefing("");
    // 1. create real vote
    let id: string | null = null;
    try {
      const r = await createVoteFn({ data: { reason, required_yes: 3 } });
      id = r.id;
      setVoteId(id);
    } catch (e) {
      setBriefing(`**ERROR:** ${e instanceof Error ? e.message : "could not create vote"}`);
      setStreaming(false);
      return;
    }
    // 2. stream AI prescreener
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "prescreen",
          messages: [{ id: "u1", role: "user", parts: [{ type: "text", text: reason }] }],
        }),
      });
      if (res.body) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const matches = buf.matchAll(/"delta":"((?:[^"\\]|\\.)*)"/g);
          let text = "";
          for (const m of matches) text += JSON.parse(`"${m[1]}"`);
          if (text) setBriefing(text);
        }
      }
    } catch {
      setBriefing((b) => b || "**Pre-screener unavailable.** Vouchers will see your raw reason.");
    }
    setStreaming(false);
    setStep("dispatched");
  }

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-12 items-start">
          <div className="md:col-span-7">
            <div className="label mb-3 stakes-crimson">⚠ BREAK-GLASS PROTOCOL</div>
            <h1 className="font-display text-5xl font-bold leading-none">EMERGENCY OVERRIDE.</h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              You are about to exit the Vault before 17:00. Two locks: a $20 fine and a quorum of
              your team. Both must clear.
            </p>
          </div>
          <div className="md:col-span-5">
            <img
              src={breakGlassImage}
              alt="Red emergency break-glass case with a steel hammer chained beside it"
              width={1600}
              height={900}
              loading="lazy"
              className="w-full brutal-border aspect-video object-cover"
            />
          </div>
        </div>

        <ol className="mt-10 grid gap-px bg-border md:grid-cols-4">
          {[
            ["01", "FINE", step === "fine"],
            ["02", "REASON", step === "reason"],
            ["03", "PRE-SCREEN", step === "screening"],
            ["04", "DISPATCHED", step === "dispatched"],
          ].map(([n, l, active]) => (
            <div key={n as string} className={`bg-background p-4 ${active ? "ring-crimson" : ""}`}>
              <div className="mono text-xs text-muted-foreground">§ {n}</div>
              <div className="mt-1 font-display font-bold">{l}</div>
            </div>
          ))}
        </ol>

        <div className="mt-10 brutal-card p-8">
          {step === "fine" && (
            <>
              <div className="label mb-3">§ 01 · AUTHORIZE FINE</div>
              <div className="mono text-6xl font-bold stakes-crimson">$20.00</div>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                Charged immediately once Stripe billing is wired. For now this is logged.
              </p>
              <button
                onClick={() => setStep("reason")}
                className="mt-8 brutal-border bg-stakes-crimson px-6 py-3 mono text-xs font-bold uppercase tracking-widest"
              >
                AUTHORIZE $20 · CONTINUE
              </button>
            </>
          )}

          {step === "reason" && (
            <>
              <div className="label mb-3">§ 02 · STATE YOUR REASON</div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                placeholder="Hospital just called — my mother's in the ER. Need to drive there now."
                className="mt-4 w-full resize-none bg-background brutal-border p-4 font-mono text-sm outline-none"
              />
              <button
                onClick={dispatch}
                disabled={reason.trim().length < 10}
                className="mt-6 brutal-border bg-stakes-crimson px-6 py-3 mono text-xs font-bold uppercase tracking-widest disabled:opacity-40"
              >
                CREATE VOTE & DISPATCH →
              </button>
            </>
          )}

          {(step === "screening" || step === "dispatched") && (
            <>
              <div className="label mb-3">§ 03 · GEMINI BRIEFING TO VOUCHERS</div>
              <div className="brutal-border bg-background p-5">
                {briefing ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{briefing}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="label pulse-stakes">PRE-SCREENER · ANALYZING</div>
                )}
                {streaming && <div className="mt-3 label pulse-stakes">● STREAMING</div>}
              </div>
              {voteId && step === "dispatched" && (
                <div className="mt-6 brutal-card p-5 ring-amber">
                  <div className="label mb-2">VOTE DISPATCHED</div>
                  <p className="text-sm">
                    Your roster has been notified. Share this link with your vouchers:
                  </p>
                  <code className="mt-3 block brutal-border bg-background p-3 mono text-xs break-all">
                    {typeof window !== "undefined" ? `${window.location.origin}/vouch/${voteId}` : ""}
                  </code>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
