import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VaultNav } from "@/components/VaultNav";
import {
  useVaultConfig,
  FREE_SEATS,
  PER_EXTRA_SEAT_USD,
  billableExtras,
  monthlyExtrasUsd,
  focusHours,
  type Member,
} from "@/lib/vault-config";

export const Route = createFileRoute("/team")({
  component: TeamPage,
  head: () => ({
    meta: [
      { title: "Team Vault · The Focus Vault" },
      {
        name: "description",
        content:
          "Invite registered members to a shared 9-to-5 lockdown. 5 seats free, $2/month per extra head. Team lead sets the focus window for everyone.",
      },
    ],
  }),
});

function TeamPage() {
  const [cfg, update] = useVaultConfig();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const n = name.trim();
    const m = email.trim().toLowerCase();
    if (!n || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) {
      setErr("Need a real name and a valid email.");
      return;
    }
    if (cfg.members.some((x) => x.email === m)) {
      setErr("Already on the roster.");
      return;
    }
    const next: Member = {
      id: crypto.randomUUID(),
      name: n,
      email: m,
      role: cfg.members.length === 0 ? "lead" : "member",
    };
    update({ members: [...cfg.members, next] });
    setName("");
    setEmail("");
  };

  const remove = (id: string) =>
    update({ members: cfg.members.filter((m) => m.id !== id) });

  const extras = billableExtras(cfg.members.length);
  const extraCost = monthlyExtrasUsd(cfg.members.length);
  const hours = focusHours(cfg.startTime, cfg.endTime);

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        <div className="label mb-4">§ 03 · TEAM VAULT</div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
          Lock the whole team in.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Invite registered members to share one vault. <span className="stakes-amber">{FREE_SEATS} seats free</span>.
          Each additional seat is <span className="stakes-amber">${PER_EXTRA_SEAT_USD}/mo</span>. Only the team lead
          can change the focus window — once locked it's immutable for everyone until release.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-12">
          {/* FOCUS WINDOW */}
          <div className="md:col-span-5 space-y-6">
            <div className="brutal-card p-6">
              <div className="label mb-3">FOCUS WINDOW · LEAD ONLY</div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="label">START</span>
                  <input
                    type="time"
                    value={cfg.startTime}
                    disabled={!cfg.isLead}
                    onChange={(e) => update({ startTime: e.target.value })}
                    className="mt-1 w-full brutal-border bg-background px-3 py-2 mono text-lg outline-none disabled:opacity-50"
                  />
                </label>
                <label className="block">
                  <span className="label">END</span>
                  <input
                    type="time"
                    value={cfg.endTime}
                    disabled={!cfg.isLead}
                    onChange={(e) => update({ endTime: e.target.value })}
                    className="mt-1 w-full brutal-border bg-background px-3 py-2 mono text-lg outline-none disabled:opacity-50"
                  />
                </label>
              </div>
              <div className="mt-4 mono text-xs text-muted-foreground">
                TOTAL FOCUS · <span className="stakes-amber">{hours.toFixed(2)} h</span> / day · applies to{" "}
                {cfg.members.length || 1} {cfg.members.length === 1 ? "operator" : "operators"}.
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
            </div>
          </div>

          {/* ROSTER */}
          <div className="md:col-span-7 space-y-6">
            <form onSubmit={add} className="brutal-card p-6">
              <div className="label mb-3">ADD REGISTERED MEMBER</div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="brutal-border bg-background px-3 py-2 text-sm outline-none"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="email@registered.com"
                  className="brutal-border bg-background px-3 py-2 text-sm outline-none"
                />
                <button
                  type="submit"
                  className="brutal-border bg-foreground px-5 py-2 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90"
                >
                  + ADD
                </button>
              </div>
              {err && <div className="mt-2 stakes-crimson mono text-xs">{err}</div>}
              <p className="mt-3 mono text-[10px] text-muted-foreground">
                Members must already have a Focus Vault account. Invites verify on the server before they're billable.
              </p>
            </form>

            <div className="brutal-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="label">ROSTER</div>
                <div className="mono text-xs">
                  <span className="stakes-amber">{cfg.members.length}</span>
                  <span className="text-muted-foreground"> / {FREE_SEATS} free · </span>
                  <span className={extras > 0 ? "stakes-crimson" : "text-muted-foreground"}>
                    {extras} paid
                  </span>
                </div>
              </div>
              {cfg.members.length === 0 ? (
                <div className="p-8 text-center mono text-xs text-muted-foreground">
                  Empty roster. Add yourself first — you become the lead.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {cfg.members.map((m, i) => {
                    const billable = i >= FREE_SEATS;
                    return (
                      <li key={m.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <div className="font-display text-sm font-bold">
                            {m.name}{" "}
                            {m.role === "lead" && (
                              <span className="ml-2 stakes-amber mono text-[10px]">LEAD</span>
                            )}
                          </div>
                          <div className="mono text-xs text-muted-foreground">{m.email}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`mono text-xs ${billable ? "stakes-crimson" : "text-muted-foreground"}`}>
                            {billable ? `+$${PER_EXTRA_SEAT_USD}/mo` : "FREE"}
                          </span>
                          <button
                            onClick={() => remove(m.id)}
                            className="mono text-xs text-muted-foreground hover:stakes-crimson"
                          >
                            REMOVE
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
