import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import { getAdminAnalytics } from "@/lib/vault-server.functions";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin Console · The Focus Vault" }, { name: "robots", content: "noindex" }] }),
});

function AdminPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  const fn = useServerFn(getAdminAnalytics);
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fn(),
    enabled: !!user,
  });

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="label mb-3">§ ADMIN · CONTROL ROOM</div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Voucher Console.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Operator metrics, override traffic, and pending vouch requests across the whole vault.
        </p>

        {isLoading && <div className="mt-10 label pulse-stakes">LOADING TELEMETRY…</div>}
        {error && (
          <div className="mt-10 brutal-card p-6 ring-crimson">
            <div className="label stakes-crimson mb-1">ACCESS DENIED</div>
            <div className="mono text-sm">{(error as Error).message}</div>
            <p className="mt-3 text-sm text-muted-foreground">
              Only admins can read this page. Ask an existing admin to promote your account in the user_roles table.
            </p>
          </div>
        )}

        {data && (
          <>
            <div className="mt-10 grid gap-px bg-border md:grid-cols-3">
              <Stat label="REGISTERED OPERATORS" v={data.users} />
              <Stat label="FOCUS SESSIONS · 7D" v={data.sessionsLast7d} accent="amber" />
              <Stat label="BREAK-GLASS · 7D" v={data.votesLast7d} accent="crimson" />
            </div>

            {/* QUORUM OUTCOMES */}
            <div className="mt-10 brutal-card p-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="label">QUORUM OUTCOMES · 30D</div>
                <div className="mono text-xs text-muted-foreground">
                  avg resolve {data.outcomes.avgResolveMin}m · {data.outcomes.totalResponses} votes cast
                </div>
              </div>
              <OutcomeBar approved={data.outcomes.approved} denied={data.outcomes.denied} pending={data.outcomes.pending} />
              <div className="mt-4 grid grid-cols-3 gap-px bg-border">
                <MiniStat label="APPROVED" v={data.outcomes.approved} tone="ok" />
                <MiniStat label="DENIED" v={data.outcomes.denied} tone="crimson" />
                <MiniStat label="STILL PENDING" v={data.outcomes.pending} tone="amber" />
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {/* VOUCHER ACTIVITY */}
              <div className="brutal-card overflow-hidden">
                <div className="border-b border-border px-5 py-3 label">VOUCHER ACTIVITY · TOP 5 · 30D</div>
                {data.topVouchers.length === 0 ? (
                  <div className="p-8 text-center mono text-xs text-muted-foreground">No vouches cast yet.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.topVouchers.map((v) => (
                      <li key={v.user_id} className="px-5 py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {v.profile?.display_name ?? v.profile?.email ?? v.user_id.slice(0, 8)}
                          </div>
                          <div className="mono text-[10px] text-muted-foreground truncate">{v.profile?.email ?? "—"}</div>
                        </div>
                        <div className="flex items-center gap-3 mono text-xs shrink-0">
                          <span className="text-emerald-500">✓ {v.yes}</span>
                          <span className="stakes-crimson">✗ {v.no}</span>
                          <span className="text-muted-foreground">/ {v.total}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* OVERRIDE HISTORY */}
              <div className="brutal-card overflow-hidden">
                <div className="border-b border-border px-5 py-3 label">OVERRIDE HISTORY · LAST 15</div>
                {data.overrideHistory.length === 0 ? (
                  <div className="p-8 text-center mono text-xs text-muted-foreground">No overrides resolved yet.</div>
                ) : (
                  <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                    {data.overrideHistory.map((h) => (
                      <li key={h.id} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`mono text-[10px] font-bold uppercase tracking-widest ${h.status === "approved" ? "text-emerald-500" : "stakes-crimson"}`}>
                            {h.status}
                          </span>
                          <span className="mono text-[10px] text-muted-foreground">
                            {h.resolved_at ? new Date(h.resolved_at).toLocaleString() : "—"}
                          </span>
                        </div>
                        <div className="mt-1 text-sm line-clamp-2">{h.reason}</div>
                        <div className="mt-1 mono text-[10px] text-muted-foreground truncate">
                          {h.owner?.display_name ?? h.owner?.email ?? h.owner_id.slice(0, 8)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-8 brutal-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="label">PENDING VOUCH REQUESTS</div>
                <div className="mono text-xs text-muted-foreground">{data.pending.length} open</div>
              </div>
              {data.pending.length === 0 ? (
                <div className="p-8 text-center mono text-xs text-muted-foreground">All clear. No-one is trying to escape.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {data.pending.map((p) => (
                    <li key={p.id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mono text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleString()} · quorum {p.required_yes}
                        </div>
                        <div className="mt-1 text-sm line-clamp-2">{p.reason}</div>
                      </div>
                      <Link
                        to="/vouch/$voteId"
                        params={{ voteId: p.id }}
                        className="brutal-border px-3 py-1.5 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary shrink-0"
                      >
                        Review →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OutcomeBar({ approved, denied, pending }: { approved: number; denied: number; pending: number }) {
  const total = Math.max(1, approved + denied + pending);
  return (
    <div className="mt-4 flex h-3 w-full overflow-hidden brutal-border">
      <div className="bg-emerald-500" style={{ width: `${(approved / total) * 100}%` }} title={`Approved ${approved}`} />
      <div style={{ width: `${(denied / total) * 100}%`, background: "hsl(0 84% 55%)" }} title={`Denied ${denied}`} />
      <div style={{ width: `${(pending / total) * 100}%`, background: "hsl(38 92% 55%)" }} title={`Pending ${pending}`} />
    </div>
  );
}

function MiniStat({ label, v, tone }: { label: string; v: number; tone: "ok" | "crimson" | "amber" }) {
  return (
    <div className="bg-background p-4">
      <div className="label">{label}</div>
      <div className={`mt-1 mono text-2xl font-bold ${tone === "ok" ? "text-emerald-500" : tone === "crimson" ? "stakes-crimson" : "stakes-amber"}`}>{v}</div>
    </div>
  );
}

function Stat({ label, v, accent }: { label: string; v: number; accent?: "amber" | "crimson" }) {
  return (
    <div className="bg-background p-6">
      <div className="label">{label}</div>
      <div className={`mt-2 mono text-4xl font-bold ${accent === "amber" ? "stakes-amber" : accent === "crimson" ? "stakes-crimson" : ""}`}>
        {v}
      </div>
    </div>
  );
}
