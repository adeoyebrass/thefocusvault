import { createFileRoute, Link } from "@tanstack/react-router";
import { VaultNav } from "@/components/VaultNav";
import { Countdown } from "@/components/Countdown";
import heroImage from "@/assets/hero-vault.jpg";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "The Focus Vault — Hard lockdown for deep work" },
      { name: "description", content: "An unyielding digital safe. 9–5 hard lockdown. $20 fine + team vouchers to break glass. For founders who are tired of pretending willpower works." },
      { property: "og:image", content: "/og-image.jpg" },
    ],
  }),
});

function Landing() {
  return (
    <div className="relative min-h-screen">
      <VaultNav />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16 items-center">
          <div className="md:col-span-7">
            <div className="label mb-6 flex items-center gap-3">
              <span className="inline-block h-1.5 w-1.5 bg-stakes-amber pulse-stakes" />
              SYSTEM ARMED · 9:00 → 17:00
            </div>
            <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
              YOUR PHONE,<br />
              <span className="text-muted-foreground">CONFISCATED</span><br />
              BY YOU.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A kiosk-grade lockdown for founders and deep-work seekers. From 9 to 5, your device
              draws one screen. To break out early you pay <span className="stakes-crimson font-semibold">$20</span> and convince your <span className="stakes-crimson font-semibold">team</span> you're not lying to yourself.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/login" className="brutal-border bg-foreground px-6 py-4 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90">
                Sign the Contract → $10/mo
              </Link>
              <Link to="/lock" className="brutal-border bg-transparent px-6 py-4 mono text-xs font-bold uppercase tracking-widest hover:bg-secondary">
                See the Lock Screen
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
              {[["8h", "HARD-LOCK BLOCK"], ["$20", "OVERRIDE FINE"], ["3", "VOUCHES TO RELEASE"]].map(([n, l]) => (
                <div key={l}>
                  <div className="mono text-3xl font-bold">{n}</div>
                  <div className="label mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5">
            <img
              src={heroImage}
              alt="A smartphone sealed inside a translucent acrylic vault on a brutalist concrete desk"
              width={1600}
              height={1024}
              className="w-full brutal-border aspect-[16/10] object-cover"
            />
            <div className="mt-6 brutal-card scanline p-6 ring-amber">
              <div className="label mb-2">LIVE · KIOSK PREVIEW</div>
              <Countdown />
            </div>
          </div>
        </div>
      </section>

      {/* RULES */}
      <section className="relative z-10 border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="label mb-4">§ 01 · THE UNYIELDING RULES</div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Four contracts. Zero escape hatches.
          </h2>
          <div className="mt-12 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                t: "$10 / MONTH",
                d: "Predictable MRR. No tiers, no upsells, no 'free week'. You're either in or you're not.",
              },
              {
                n: "02",
                t: "9:00 → 17:00",
                d: "Customize once at setup. Once active: immutable. The block survives reboots, force-quits, and OS updates.",
              },
              {
                n: "03",
                t: "BOOT-PERSISTENT",
                d: "Hooks BOOT_COMPLETED on Android; aggressive Screen Time + tamper webhooks on iOS. The vault draws first.",
              },
              {
                n: "04",
                t: "BREAK-GLASS",
                d: "Pay $20. Submit your reason. 10 humans vote. Both conditions required. No backdoors.",
              },
            ].map((r) => (
              <div key={r.n} className="bg-background p-8">
                <div className="mono text-xs text-muted-foreground">§ {r.n}</div>
                <div className="mt-4 font-display text-2xl font-bold">{r.t}</div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI LAYER */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="label mb-4">§ 02 · THE GEMINI LAYER</div>
        <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Three AI agents. Each one works against your worst self.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Focus Contracting",
              d: "A 2-minute pre-lock huddle. Gemini interrogates your vague goals, demands deliverables, and forges a defensible hourly timeline.",
              cta: { to: "/huddle", l: "Run the huddle" },
            },
            {
              t: "Voucher Pre-Screener",
              d: "When you break glass, Gemini converts your panic into an objective briefing for your 10 Vouchers — filtering boredom from real emergencies.",
              cta: { to: "/break-glass", l: "Simulate override" },
            },
            {
              t: "Anti-Churn Analyzer",
              d: "Silent telemetry. Repeat overrides flag you for a 'Warm-Up Tier' — half-day blocks via email — before you cancel.",
              cta: null,
            },
          ].map((c) => (
            <div key={c.t} className="brutal-card p-8">
              <h3 className="font-display text-xl font-bold">{c.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              {c.cta && (
                <Link
                  to={c.cta.to}
                  className="mt-6 inline-block mono text-xs font-bold uppercase tracking-widest underline underline-offset-4 hover:stakes-amber"
                >
                  {c.cta.l} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
            Willpower failed. Try architecture.
          </h2>
          <Link
            to="/huddle"
            className="mt-10 inline-block brutal-border bg-foreground px-10 py-5 mono text-sm font-bold uppercase tracking-widest text-background hover:opacity-90"
          >
            Lock myself in → $10/mo
          </Link>
          <p className="mt-6 mono text-xs text-muted-foreground">
            Cancel anytime · Override $20 · No refunds on override fines
          </p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 flex justify-between mono text-xs text-muted-foreground">
          <span>© THE FOCUS VAULT · KIOSK GRADE</span>
          <span>STATUS: ARMED</span>
        </div>
      </footer>
    </div>
  );
}
