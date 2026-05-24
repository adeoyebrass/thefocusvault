import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/vouch/$voteId")({
  component: VoucherPortal,
  head: () => ({
    meta: [
      { title: "Vouch Request · The Focus Vault" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function VoucherPortal() {
  const { voteId } = Route.useParams();
  const [decision, setDecision] = useState<null | "VOUCH" | "KEEP">(null);

  const briefing = {
    user: "Marcus L.",
    streak: 23,
    timeLeft: "3h 12m",
    classification: "QUESTIONABLE",
    paraphrase:
      "User says a 'critical client call' was just scheduled by a prospect and refuses to wait until 17:00.",
    signals: [
      "No supporting evidence (calendar invite, email) provided.",
      "User has triggered 3 overrides in the last 14 days, 2 in the same band.",
      "Prospect identity not disclosed.",
    ],
    recommendation:
      "Likely deferrable. Consider whether the call can be rescheduled by 2 hours without commercial damage.",
  };

  if (decision) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-6">
        <div className="relative z-10 max-w-md text-center brutal-card p-10">
          <div className="label mb-2 stakes-amber">VOTE RECORDED</div>
          <h1 className="font-display text-4xl font-bold">
            {decision === "VOUCH" ? "RELEASE REQUESTED." : "KEEP LOCKED."}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Your vote was sent to the Vault. {decision === "VOUCH" ? "5 more vouchers needed for release." : "5 more 'keep locked' votes will deny the override."}
          </p>
          <div className="mt-6 mono text-xs text-muted-foreground">VOTE ID · {voteId}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-10">
      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="flex items-center gap-3 label">
          <span className="inline-block h-1.5 w-1.5 bg-stakes-crimson pulse-stakes" />
          INCOMING VOUCH REQUEST · {voteId}
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
          {briefing.user} wants out of the Vault early.
        </h1>
        <p className="mt-3 text-muted-foreground">
          You are 1 of 10 Vouchers. Read the briefing. Vote with intent.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-px bg-border">
          <div className="bg-background p-4">
            <div className="label">STREAK</div>
            <div className="mono text-2xl font-bold">{briefing.streak}d</div>
          </div>
          <div className="bg-background p-4">
            <div className="label">TIME LEFT</div>
            <div className="mono text-2xl font-bold stakes-amber">{briefing.timeLeft}</div>
          </div>
          <div className="bg-background p-4">
            <div className="label">SIGNAL</div>
            <div className="mono text-lg font-bold stakes-crimson">{briefing.classification}</div>
          </div>
        </div>

        <div className="mt-6 brutal-card p-6">
          <div className="label mb-2">AI PRE-SCREENER · OBJECTIVE BRIEFING</div>
          <p className="text-sm leading-relaxed"><span className="label mr-2">REASON</span>{briefing.paraphrase}</p>
          <ul className="mt-4 space-y-1.5 text-sm leading-relaxed">
            {briefing.signals.map((s) => (
              <li key={s} className="flex gap-3">
                <span className="stakes-crimson mono">▸</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed border-t border-border pt-4">
            <span className="label mr-2">RECOMMENDATION</span>{briefing.recommendation}
          </p>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <button
            onClick={() => setDecision("VOUCH")}
            className="brutal-border bg-stakes-amber py-6 font-display text-xl font-bold uppercase tracking-tight hover:opacity-90"
          >
            ✓ VOUCH · APPROVE RELEASE
          </button>
          <button
            onClick={() => setDecision("KEEP")}
            className="brutal-border bg-stakes-crimson py-6 font-display text-xl font-bold uppercase tracking-tight hover:opacity-90"
          >
            ✕ KEEP LOCKED
          </button>
        </div>
        <p className="mt-6 mono text-[10px] text-muted-foreground text-center">
          Your vote is logged with timestamp & device fingerprint. The Vault never reveals who voted what.
        </p>
      </div>
    </div>
  );
}
