import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";

export const Route = createFileRoute("/lock")({
  component: LockScreen,
  head: () => ({ meta: [{ title: "LOCKED · The Focus Vault" }] }),
});

function LockScreen() {
  const [scratch, setScratch] = useState("");
  const [holdPct, setHoldPct] = useState(0);

  // local-only scratchpad
  useEffect(() => {
    setScratch(localStorage.getItem("vault.scratch") ?? "");
  }, []);
  useEffect(() => {
    localStorage.setItem("vault.scratch", scratch);
  }, [scratch]);

  // 3-second hold to arm break-glass
  useEffect(() => {
    if (holdPct === 0 || holdPct >= 100) return;
    const id = setInterval(() => setHoldPct((p) => Math.min(p + 2, 100)), 60);
    return () => clearInterval(id);
  }, [holdPct]);

  const contract = [
    ["09:00", "Auth flow scaffolding"],
    ["10:00", "Supabase RLS + seed data"],
    ["11:00", "Email magic-link end-to-end"],
    ["12:00", "Lunch · phone stays dark"],
    ["13:00", "Voucher portal v0"],
    ["14:00", "Stripe override webhook"],
    ["15:00", "Telemetry + churn flag"],
    ["16:00", "Ship to staging · write demo notes"],
  ];

  return (
    <div className="relative min-h-screen overflow-hidden scanline">
      {/* kiosk chrome */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between border-b border-border bg-background/90 px-4 py-2 mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
        <span className="stakes-amber">● VAULT//KIOSK MODE</span>
        <span>HOME · BACK · RECENTS — DISABLED</span>
        <Link to="/" className="hover:text-foreground">EXIT DEMO</Link>
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl gap-10 px-6 pt-16 pb-24 md:grid-cols-12 md:items-center">
        {/* COUNTDOWN HERO */}
        <div className="md:col-span-7">
          <div className="label mb-6">YOUR PHONE IS IN THE VAULT</div>
          <Countdown />
          <div className="mt-10 brutal-card p-6 ring-amber">
            <div className="label mb-2">TODAY'S PRIMARY GOAL · IMMUTABLE</div>
            <p className="font-display text-3xl font-bold leading-tight md:text-4xl">
              Ship v0 of the auth flow. Nothing else exists today.
            </p>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="space-y-6 md:col-span-5">
          <div className="brutal-card p-5">
            <div className="label mb-3">HOURLY CONTRACT</div>
            <ul className="space-y-1.5">
              {contract.map(([t, d]) => (
                <li key={t} className="flex gap-4 mono text-xs">
                  <span className="stakes-amber w-12">{t}</span>
                  <span className="text-foreground">{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="brutal-card p-5">
            <div className="label mb-3">LOCAL SCRATCHPAD · NEVER LEAVES DEVICE</div>
            <textarea
              value={scratch}
              onChange={(e) => setScratch(e.target.value)}
              rows={4}
              placeholder="Capture stray thoughts. They wait here until 5pm."
              className="w-full resize-none bg-background brutal-border p-3 text-sm font-mono outline-none"
            />
          </div>

          {/* BREAK GLASS — hold to arm */}
          <div className="brutal-border bg-card/60 p-5">
            <div className="label mb-3 stakes-crimson">⚠ EMERGENCY OVERRIDE</div>
            <button
              onMouseDown={() => setHoldPct(1)}
              onMouseUp={() => holdPct < 100 && setHoldPct(0)}
              onMouseLeave={() => holdPct < 100 && setHoldPct(0)}
              onTouchStart={() => setHoldPct(1)}
              onTouchEnd={() => holdPct < 100 && setHoldPct(0)}
              className="relative w-full overflow-hidden brutal-border bg-background py-4 mono text-xs font-bold uppercase tracking-widest stakes-crimson"
            >
              <span
                className="absolute inset-y-0 left-0 bg-stakes-crimson"
                style={{ width: `${holdPct}%`, transition: "width 60ms linear" }}
              />
              <span className="relative">
                {holdPct >= 100 ? (
                  <Link to="/break-glass" className="block">→ PROCEED TO BREAK-GLASS</Link>
                ) : holdPct > 0 ? (
                  `HOLD · ${holdPct}%`
                ) : (
                  "HOLD 3 SECONDS TO ARM"
                )}
              </span>
            </button>
            <p className="mt-3 mono text-[10px] text-muted-foreground">
              $20 fine · 10 voucher approvals · no partial credit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
