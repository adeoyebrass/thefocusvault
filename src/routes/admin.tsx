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

            <div className="mt-10 brutal-card overflow-hidden">
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
