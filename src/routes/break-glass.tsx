import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { VaultNav } from "@/components/VaultNav";

export const Route = createFileRoute("/break-glass")({
  component: BreakGlassPage,
  head: () => ({ meta: [{ title: "Break Glass · The Focus Vault" }] }),
});

type Step = "fine" | "reason" | "screening" | "dispatched";

function BreakGlassPage() {
  const [step, setStep] = useState<Step>("fine");
  const [reason, setReason] = useState("");
  const [briefing, setBriefing] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [votes, setVotes] = useState<("PENDING" | "VOUCH" | "KEEP")[]>(
    Array.from({ length: 10 }, () => "PENDING")
  );

  async function runPrescreen() {
    setStep("screening");
    setStreaming(true);
    setBriefing("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "prescreen",
          messages: [
            {
              id: "u1",
              role: "user",
              parts: [{ type: "text", text: reason }],
            },
          ],
        }),
      });
      if (!res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        // crude extraction of text deltas from UI message stream
        const matches = buf.matchAll(/"delta":"((?:[^"\\]|\\.)*)"/g);
        let text = "";
        for (const m of matches) text += JSON.parse(`"${m[1]}"`);
        if (text) setBriefing(text);
      }
    } catch (e) {
      setBriefing("**CLASSIFICATION:** SYSTEM ERROR\n\nCould not reach pre-screener.");
    }
    setStreaming(false);
    setStep("dispatched");
    // simulate vouchers trickling in
    let i = 0;
    const id = setInterval(() => {
      setVotes((prev) => {
        const next = [...prev];
        const idx = next.findIndex((v) => v === "PENDING");
        if (idx === -1) {
          clearInterval(id);
          return prev;
        }
        next[idx] = Math.random() > 0.45 ? "VOUCH" : "KEEP";
        return next;
      });
      if (++i >= 10) clearInterval(id);
    }, 900);
  }

  const vouchCount = votes.filter((v) => v === "VOUCH").length;
  const keepCount = votes.filter((v) => v === "KEEP").length;
  const released = vouchCount >= 6;
  const denied = keepCount >= 5;

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        <div className="label mb-3 stakes-crimson">⚠ BREAK-GLASS PROTOCOL</div>
        <h1 className="font-display text-5xl font-bold leading-none">EMERGENCY OVERRIDE.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          You are about to exit the Vault before 17:00. Two locks: a $20 fine and a quorum of
          your 10 Vouchers. Both must clear. No backdoor exists.
        </p>

        {/* STEP TRACKER */}
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

        {/* STEP CONTENT */}
        <div className="mt-10 brutal-card p-8">
          {step === "fine" && (
            <>
              <div className="label mb-3">§ 01 · AUTHORIZE FINE</div>
              <div className="mono text-6xl font-bold stakes-crimson">$20.00</div>
              <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                Charged immediately to the card on file. Non-refundable. Funds the Anti-Churn
                program for users at risk of canceling.
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
              <p className="text-sm text-muted-foreground">
                Type or dictate. The AI Pre-Screener will convert this into an objective briefing for
                your 10 Vouchers. Vagueness will be flagged.
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                placeholder="e.g. Hospital just called — my mother's in the ER. Need to drive there now."
                className="mt-4 w-full resize-none bg-background brutal-border p-4 font-mono text-sm outline-none"
              />
              <button
                onClick={runPrescreen}
                disabled={reason.trim().length < 10}
                className="mt-6 brutal-border bg-stakes-crimson px-6 py-3 mono text-xs font-bold uppercase tracking-widest disabled:opacity-40"
              >
                SUBMIT TO PRE-SCREENER →
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
            </>
          )}

          {step === "dispatched" && (
            <div className="mt-8">
              <div className="label mb-3">§ 04 · 10 VOUCHERS NOTIFIED</div>
              <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                {votes.map((v, i) => (
                  <div
                    key={i}
                    className={`brutal-border p-3 text-center mono text-[10px] ${
                      v === "VOUCH"
                        ? "bg-stakes-amber stakes-amber"
                        : v === "KEEP"
                        ? "bg-stakes-crimson"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold">V{String(i + 1).padStart(2, "0")}</div>
                    <div className="mt-1">{v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-px bg-border">
                <div className="bg-background p-4">
                  <div className="label">VOUCH</div>
                  <div className="mono text-3xl font-bold stakes-amber">{vouchCount}/6</div>
                </div>
                <div className="bg-background p-4">
                  <div className="label">KEEP LOCKED</div>
                  <div className="mono text-3xl font-bold stakes-crimson">{keepCount}/5</div>
                </div>
                <div className="bg-background p-4">
                  <div className="label">STATUS</div>
                  <div className="mono text-lg font-bold">
                    {released ? (
                      <span className="stakes-amber">RELEASED</span>
                    ) : denied ? (
                      <span className="stakes-crimson">DENIED</span>
                    ) : (
                      <span className="pulse-stakes">VOTING</span>
                    )}
                  </div>
                </div>
              </div>
              <Link
                to="/vouch/demo-vote-001"
                className="mt-6 inline-block label underline-offset-4 hover:underline"
              >
                → see the voucher portal your friends receive
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
