import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import { listMyTeam, addTeamMember, removeTeamMember } from "@/lib/vault-server.functions";
import { getTeamLockStatus, sendLockReminder } from "@/lib/company.functions";
import {
  useVaultConfig,
  FREE_SEATS,
  PER_EXTRA_SEAT_USD,
  billableExtras,
  monthlyExtrasUsd,
  focusHours,
} from "@/lib/vault-config";
import teamImage from "@/assets/team-huddle.jpg";

export const Route = createFileRoute("/team")({
  component: TeamPage,
  head: () => ({
    meta: [
      { title: "Team Vault · The Focus Vault" },
      {
        name: "description",
        content:
          "Invite registered members to a shared 9-to-5 lockdown. 5 seats free, $2/month per extra head.",
      },
    ],
  }),
});

function TeamPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  const [cfg, update] = useVaultConfig();
  const qc = useQueryClient();
  const list = useServerFn(listMyTeam);
  const add = useServerFn(addTeamMember);
  const remove = useServerFn(removeTeamMember);

  const { data: roster = [] } = useQuery({
    queryKey: ["my-team"],
    queryFn: () => list(),
    enabled: !!user,
  });

  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await add({ data: { email: email.trim().toLowerCase() } });
      setEmail("");
      qc.invalidateQueries({ queryKey: ["my-team"] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function onRemove(id: string) {
    await remove({ data: { id } });
    qc.invalidateQueries({ queryKey: ["my-team"] });
  }

  const seatCount = roster.length + 1; // include lead
  const extras = billableExtras(seatCount);
  const extraCost = monthlyExtrasUsd(seatCount);
  const hours = focusHours(cfg.startTime, cfg.endTime);

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-12 items-start">
          <div className="md:col-span-7">
            <div className="label mb-4">§ 03 · TEAM VAULT</div>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              Lock the whole team in.
            </h1>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Add registered users by email. <span className="stakes-amber">{FREE_SEATS} seats free</span> (you + {FREE_SEATS - 1}).
              Each additional seat is <span className="stakes-amber">${PER_EXTRA_SEAT_USD}/mo</span>. Only the lead
              sets the focus window — once active it's immutable for everyone.
            </p>
          </div>
          <div className="md:col-span-5">
            <img
              src={teamImage}
              alt="Team members locking phones into a shared brutalist vault"
              width={1600}
              height={900}
              loading="lazy"
              className="w-full brutal-border aspect-video object-cover"
            />
          </div>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5 space-y-6">
            <div className="brutal-card p-6">
              <div className="label mb-3">FOCUS WINDOW · LEAD ONLY</div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="label">START</span>
                  <input
                    type="time"
                    value={cfg.startTime}
                    onChange={(e) => update({ startTime: e.target.value })}
                    className="mt-1 w-full brutal-border bg-background px-3 py-2 mono text-lg outline-none"
                  />
                </label>
                <label className="block">
                  <span className="label">END</span>
                  <input
                    type="time"
                    value={cfg.endTime}
                    onChange={(e) => update({ endTime: e.target.value })}
                    className="mt-1 w-full brutal-border bg-background px-3 py-2 mono text-lg outline-none"
                  />
                </label>
              </div>
              <div className="mt-4 mono text-xs text-muted-foreground">
                TOTAL FOCUS · <span className="stakes-amber">{hours.toFixed(2)} h</span> / day · {seatCount} operator{seatCount === 1 ? "" : "s"}.
              </div>
            </div>

            <div className="brutal-card p-6 ring-amber">
              <div className="label mb-2">BILLING SUMMARY</div>
              <ul className="mono text-sm space-y-1">
                <li className="flex justify-between"><span>Base ({FREE_SEATS} seats incl.)</span><span>$10.00</span></li>
                <li className="flex justify-between">
                  <span>Extra seats × {extras}</span>
                  <span>${extraCost.toFixed(2)}</span>
                </li>
                <li className="flex justify-between border-t border-border pt-2 mt-2 font-bold">
                  <span>MONTHLY TOTAL</span>
                  <span className="stakes-amber">${(10 + extraCost).toFixed(2)}</span>
                </li>
              </ul>
              <p className="mt-3 mono text-[10px] text-muted-foreground">
                Stripe billing wires up in the next deploy. Today the contract is logged but not charged.
              </p>
            </div>
          </div>

          <div className="md:col-span-7 space-y-6">
            <form onSubmit={onAdd} className="brutal-card p-6">
              <div className="label mb-3">ADD REGISTERED MEMBER (BY EMAIL)</div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="member@registered.com"
                  className="brutal-border bg-background px-3 py-2 text-sm outline-none"
                />
                <button className="brutal-border bg-foreground px-5 py-2 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90">
                  + ADD
                </button>
              </div>
              {err && <div className="mt-2 stakes-crimson mono text-xs">{err}</div>}
              <p className="mt-3 mono text-[10px] text-muted-foreground">
                The user must already have a Focus Vault account. The email is checked server-side against the user directory.
              </p>
            </form>

            <div className="brutal-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="label">ROSTER</div>
                <div className="mono text-xs">
                  <span className="stakes-amber">{seatCount}</span>
                  <span className="text-muted-foreground"> seat{seatCount === 1 ? "" : "s"} · </span>
                  <span className={extras > 0 ? "stakes-crimson" : "text-muted-foreground"}>
                    {extras} paid
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-border">
                <li className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="font-display text-sm font-bold">
                      {user?.email ?? "you"} <span className="ml-2 stakes-amber mono text-[10px]">LEAD</span>
                    </div>
                    <div className="mono text-xs text-muted-foreground">you</div>
                  </div>
                  <span className="mono text-xs text-muted-foreground">FREE</span>
                </li>
                {roster.map((m, i) => {
                  const billable = i + 1 >= FREE_SEATS;
                  return (
                    <li key={m.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="font-display text-sm font-bold">
                          {m.profile?.display_name ?? m.profile?.email ?? m.member_id}
                        </div>
                        <div className="mono text-xs text-muted-foreground">{m.profile?.email}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`mono text-xs ${billable ? "stakes-crimson" : "text-muted-foreground"}`}>
                          {billable ? `+$${PER_EXTRA_SEAT_USD}/mo` : "FREE"}
                        </span>
                        <button
                          onClick={() => onRemove(m.id)}
                          className="mono text-xs text-muted-foreground hover:stakes-crimson"
                        >
                          REMOVE
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <TeamStatusPanel />

            <Link to="/break-glass" className="block brutal-border px-5 py-4 mono text-xs uppercase tracking-widest hover:bg-secondary">
              → request a break-glass vote · your roster will be notified
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamStatusPanel() {
  const fetchStatus = useServerFn(getTeamLockStatus);
  const remind = useServerFn(sendLockReminder);
  const qc = useQueryClient();
  const { data: status = [] } = useQuery({
    queryKey: ["team-lock-status"],
    queryFn: () => fetchStatus(),
    refetchInterval: 30_000,
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onRemind(memberId: string, name: string) {
    setBusyId(memberId);
    try {
      await remind({
        data: {
          member_id: memberId,
          message: `Reminder for ${name}: lock your phone now — the team is watching.`,
        },
      });
      qc.invalidateQueries({ queryKey: ["team-lock-status"] });
    } finally {
      setBusyId(null);
    }
  }

  if (status.length === 0) return null;

  return (
    <div className="brutal-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="label">COMPANY LOCK VISIBILITY · LIVE</div>
        <span className="mono text-[10px] text-muted-foreground">refreshes every 30s</span>
      </div>
      <ul className="divide-y divide-border">
        {status.map((s) => {
          const name = s.profile?.display_name ?? s.profile?.email ?? s.member_id;
          const when = s.last_event
            ? new Date(s.last_event.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—";
          return (
            <li key={s.member_id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block h-2 w-2 ${s.is_locked ? "bg-stakes-amber pulse-stakes" : "bg-muted"}`}
                  aria-hidden
                />
                <div>
                  <div className="font-display text-sm font-bold">{name}</div>
                  <div className="mono text-[10px] text-muted-foreground">
                    {s.is_locked ? `LOCKED · since ${when}` : s.last_event ? `IDLE · last seen ${when}` : "NO LOCK EVENTS YET"}
                  </div>
                </div>
              </div>
              {!s.is_locked && (
                <button
                  disabled={busyId === s.member_id}
                  onClick={() => onRemind(s.member_id, name)}
                  className="brutal-border px-3 py-1.5 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary disabled:opacity-50"
                >
                  {busyId === s.member_id ? "Sending…" : "Send reminder"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
