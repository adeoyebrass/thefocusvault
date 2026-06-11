import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import { supabase } from "@/integrations/supabase/client";
import { forceLockState, getTelemetryGrid, type TelemetryRow } from "@/lib/telemetry.functions";

export const Route = createFileRoute("/telemetry")({
  component: TelemetryPage,
  head: () => ({
    meta: [
      { title: "Telemetry Matrix · The Focus Vault" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function TelemetryPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  const fn = useServerFn(getTelemetryGrid);
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({
    queryKey: ["telemetry-grid"],
    queryFn: () => fn(),
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Realtime: refetch on lock_events insert
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("telemetry")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lock_events" }, () => {
        qc.invalidateQueries({ queryKey: ["telemetry-grid"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "focus_rooms" }, () => {
        qc.invalidateQueries({ queryKey: ["telemetry-grid"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  const force = useServerFn(forceLockState);
  const forceMut = useMutation({
    mutationFn: force,
    onSuccess: () => {
      toast.success("Command dispatched.");
      qc.invalidateQueries({ queryKey: ["telemetry-grid"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="label mb-3">§ CORE · TELEMETRY MATRIX</div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Live device grid.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Realtime lock state across every operator. Drop-offs &gt; 5 min are flagged{" "}
          <span className="stakes-amber">OFFLINE — POSSIBLE EVASION</span>.
        </p>

        {isLoading && <div className="mt-10 label pulse-stakes">SYNCING TELEMETRY…</div>}
        {error && (
          <div className="mt-10 brutal-card p-6 ring-crimson">
            <div className="label stakes-crimson mb-1">ACCESS DENIED</div>
            <div className="mono text-sm">{(error as Error).message}</div>
          </div>
        )}

        {data && (
          <div className="mt-8 brutal-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-card/40">
                <tr className="label">
                  <th className="px-4 py-3 text-left">Operator</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Active Room</th>
                  <th className="px-4 py-3 text-left">Flags</th>
                  <th className="px-4 py-3 text-right">Remote Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((row) => (
                  <Row key={row.user_id} row={row} onAction={(action) => forceMut.mutate({ data: { user_id: row.user_id, action } })} />
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center mono text-xs text-muted-foreground">
                      No operators registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ row, onAction }: { row: TelemetryRow; onAction: (a: "lock" | "unlock" | "ping") => void }) {
  const statusIcon =
    row.status === "locked" ? "🔒" : row.status === "unlocked" ? "🔓" : "📵";
  const statusLabel =
    row.status === "locked"
      ? "LOCKED"
      : row.status === "unlocked"
      ? "UNLOCKED"
      : "OFFLINE — POSSIBLE EVASION";
  const statusClass =
    row.status === "locked"
      ? "text-emerald-500"
      : row.status === "unlocked"
      ? "text-foreground"
      : "stakes-amber";
  return (
    <tr>
      <td className="px-4 py-3">
        <div className="text-sm font-medium">{row.display_name ?? row.email ?? row.user_id.slice(0, 8)}</div>
        <div className="mono text-[10px] text-muted-foreground">{row.email ?? "—"}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`mono text-[11px] font-bold uppercase tracking-widest ${statusClass}`}>
          {statusIcon} {statusLabel}
        </span>
        {row.last_event && (
          <div className="mono text-[10px] text-muted-foreground">
            {new Date(row.last_event.created_at).toLocaleString()}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-sm">{row.active_room?.title ?? <span className="text-muted-foreground">—</span>}</td>
      <td className="px-4 py-3">
        <span className={`mono text-xs ${row.violation_flags > 0 ? "stakes-crimson" : "text-muted-foreground"}`}>
          {row.violation_flags}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex gap-1">
          <button
            onClick={() => onAction("lock")}
            className="brutal-border px-2 py-1 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary"
          >
            Lock
          </button>
          <button
            onClick={() => onAction("unlock")}
            className="brutal-border px-2 py-1 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary"
          >
            Unlock
          </button>
          <button
            onClick={() => onAction("ping")}
            className="brutal-border px-2 py-1 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary"
          >
            Ping
          </button>
        </div>
      </td>
    </tr>
  );
}
