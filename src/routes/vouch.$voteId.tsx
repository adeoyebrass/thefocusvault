import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import { getVote, respondToVote } from "@/lib/vault-server.functions";

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
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  const qc = useQueryClient();
  const fetchVote = useServerFn(getVote);
  const respond = useServerFn(respondToVote);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vote", voteId],
    queryFn: () => fetchVote({ data: { id: voteId } }),
    enabled: !!user,
  });

  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");

  async function cast(decision: "yes" | "no") {
    setBusy(true);
    try {
      await respond({ data: { vote_id: voteId, decision, comment: comment || undefined } });
      qc.invalidateQueries({ queryKey: ["vote", voteId] });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-center gap-3 label">
          <span className="inline-block h-1.5 w-1.5 bg-stakes-crimson pulse-stakes" />
          VOUCH REQUEST · {voteId.slice(0, 8)}
        </div>

        {isLoading && <div className="mt-8 label pulse-stakes">LOADING BRIEFING…</div>}
        {error && (
          <div className="mt-8 brutal-card p-6 ring-crimson">
            <div className="label stakes-crimson mb-1">CANNOT VIEW</div>
            <div className="mono text-sm">{(error as Error).message}</div>
            <p className="mt-3 text-sm text-muted-foreground">
              You can only see a vote if you're the owner, on the owner's team roster, or an admin.
            </p>
          </div>
        )}

        {data && (
          <>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">
              {data.isOwner ? "Your" : `${data.owner?.display_name ?? "An operator"}'s`} break-glass request.
            </h1>
            <p className="mt-3 text-muted-foreground">
              Status: <span className={
                data.vote.status === "approved" ? "stakes-amber" :
                data.vote.status === "denied" ? "stakes-crimson" : ""
              }>{data.vote.status.toUpperCase()}</span> · quorum {data.vote.required_yes} yes.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-px bg-border">
              <div className="bg-background p-4">
                <div className="label">YES</div>
                <div className="mono text-2xl font-bold stakes-amber">{data.yes}</div>
              </div>
              <div className="bg-background p-4">
                <div className="label">NO</div>
                <div className="mono text-2xl font-bold stakes-crimson">{data.no}</div>
              </div>
              <div className="bg-background p-4">
                <div className="label">QUORUM</div>
                <div className="mono text-2xl font-bold">{data.vote.required_yes}</div>
              </div>
            </div>

            <div className="mt-6 brutal-card p-6">
              <div className="label mb-2">STATED REASON</div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.vote.reason}</p>
            </div>

            {!data.isOwner && data.vote.status === "pending" && (
              <div className="mt-6 brutal-card p-6">
                <div className="label mb-3">
                  {data.myResponse ? `YOU VOTED · ${data.myResponse.decision.toUpperCase()}` : "CAST YOUR VOTE"}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional comment (private to the owner & admins)"
                  rows={3}
                  className="w-full brutal-border bg-background p-3 text-sm outline-none"
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    disabled={busy}
                    onClick={() => cast("yes")}
                    className="brutal-border bg-stakes-amber py-4 font-display text-lg font-bold uppercase hover:opacity-90 disabled:opacity-50"
                  >
                    ✓ VOUCH · RELEASE
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => cast("no")}
                    className="brutal-border bg-stakes-crimson py-4 font-display text-lg font-bold uppercase hover:opacity-90 disabled:opacity-50"
                  >
                    ✕ KEEP LOCKED
                  </button>
                </div>
              </div>
            )}

            {data.isOwner && (
              <p className="mt-6 mono text-xs text-muted-foreground">
                You can't vote on your own request. Wait for your roster.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
