import { createFileRoute, Link } from "@tanstack/react-router";
import { VaultNav } from "@/components/VaultNav";
import { SiteFooter } from "@/components/SiteFooter";
import logoAsset from "@/assets/logo.png.asset.json";
const logo = logoAsset.url;

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "The Focus Vault — Why the world can't focus anymore" },
      { name: "description", content: "The global focus crisis, explained. Plus a kiosk-grade phone lockdown that businesses, teams and individuals use to take their attention back. $10/mo + $20 break-glass." },
      { property: "og:title", content: "The Focus Vault — Take your attention back" },
      { property: "og:description", content: "Why the world can't focus, and the lockdown app fixing it. From $50/year. Stake up to 70% of your plan per session." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const REGIONS = [
  { place: "United States", stat: "344 min/day", note: "average smartphone use, +12% YoY" },
  { place: "Brazil", stat: "5h 24m", note: "highest social-media time on earth" },
  { place: "Philippines", stat: "5h 47m", note: "TikTok + Messenger dominate the workday" },
  { place: "United Kingdom", stat: "63%", note: "of knowledge workers self-report 'shallow days'" },
  { place: "Germany", stat: "47 sec", note: "median attention on a screen before a task switch" },
  { place: "India", stat: "204 unlocks", note: "phone unlocks per worker per day" },
  { place: "Japan", stat: "1 in 3", note: "white-collar workers report 'brain fog' weekly" },
  { place: "Nigeria", stat: "6h 10m", note: "daily mobile screen time among 18–34" },
];

const STRUGGLES = [
  { h: "The 47-second self", b: "Microsoft's Work Trend Index found the median worker switches contexts every 47 seconds. Deep work has been replaced by reactive work." },
  { h: "Engineered to interrupt", b: "Every notification, badge, and infinite scroll was A/B-tested to defeat your willpower. You are not weak — you are outgunned." },
  { h: "Attention residue", b: "Each glance at your phone costs ~23 minutes of cognitive recovery. Five glances = a lost morning." },
  { h: "Remote work made it worse", b: "Without office friction, the only thing standing between you and TikTok is a decision you have to make 200 times a day." },
  { h: "Children inherit the loop", b: "Teens average 8h 39m on screens daily. The pattern is becoming generational, not personal." },
  { h: "Apps that promise to help, don't", b: "Soft blockers (Forest, Freedom, Screen Time) all ship a 'just kidding' button. Willpower at the moment of weakness is exactly what failed you the first time." },
];

const PLANS = [
  {
    name: "SINGLE PASS",
    price: "$50",
    cadence: "/ year",
    line: "One operator. Annual lockdown.",
    bullets: [
      "1 seat. Kiosk-grade hard lock.",
      "AI Huddle + daily focus contract.",
      "$20 fine charged instantly to your card on every break-glass attempt.",
      "AI pre-screener parses every breakout excuse.",
    ],
    cta: { label: "Lock myself in", to: "/login" as const },
    accent: false,
  },
  {
    name: "FAMILY VAULT",
    price: "$220",
    cadence: "/ year · up to 6 seats",
    line: "Households, partners, parents.",
    bullets: [
      "6 seats included.",
      "Provision Extra Hours Rooms (extension or ephemeral).",
      "$20 fine billed to the parent admin card on every approved release.",
      "Vouchers vote on every break-glass attempt.",
    ],
    cta: { label: "Start a family vault", to: "/rooms" as const },
    accent: true,
  },
  {
    name: "CORPORATE SPRINT",
    price: "$350",
    cadence: "/ year · up to 10 seats",
    line: "Startups, agencies, focus-first teams.",
    bullets: [
      "10 seats included.",
      "Live admin telemetry grid + remote lock/unlock.",
      "$20 fine billed to corporate expense, logged to seat registry.",
      "Onboarding + partner support.",
    ],
    cta: { label: "Talk to us", to: "/partner" as const },
    accent: false,
  },
  {
    name: "HARDCORE SOLO",
    price: "$10",
    cadence: "/ month",
    line: "Chronic relapsers. Last-shot mode.",
    bullets: [
      "1 seat, month-to-month, highest friction.",
      "$20 fine PLUS mandatory 10-Voucher verification block.",
      "No quorum, no release — peers must individually clear you.",
      "Use when willpower has already failed twice.",
    ],
    cta: { label: "Go hardcore", to: "/login" as const },
    accent: false,
  },
];

const REVENUE_LINES = [
  { k: "Single Pass", v: "$50 / year per operator. One seat. $20 fine to user card on every break-glass." },
  { k: "Family Vault", v: "$220 / year, 6 seats included. $20 fine billed to the parent admin card on every approved release." },
  { k: "Corporate Sprint", v: "$350 / year, 10 seats included. $20 fine billed to corporate expense, logged to seat registry." },
  { k: "Hardcore Solo", v: "$10 / month. $20 fine + mandatory 10-Voucher verification network block on every breakout." },
  { k: "Universal $20 Break-Glass", v: "Forfeited fines fund the voucher pool and charity partners. The $20 is the forcing function — every tier, no exceptions." },
];


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
              THE WORLD IS LOSING ITS ATTENTION
            </div>
            <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
              The average human now loses focus every <span className="stakes-crimson">47 seconds</span>.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              From São Paulo to Seoul, the attention economy has stolen the deep work
              that used to build companies, books and careers. The Focus Vault is the
              counter-weapon — a kiosk-grade lockdown for your phone that you cannot
              talk your way out of.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/waitlist" className="brutal-border bg-foreground px-6 py-4 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90">
                Join the waitlist →
              </Link>
              <Link to="/login" className="brutal-border bg-stakes-amber px-6 py-4 mono text-xs font-bold uppercase tracking-widest hover:opacity-90">
                Lock yourself in · $10/mo
              </Link>
            </div>
          </div>

          <div className="md:col-span-5 flex justify-center">
            <img
              src={logo}
              alt="The Focus Vault logo"
              className="w-full max-w-sm brutal-border bg-background p-8"
            />
          </div>
        </div>
      </section>

      {/* WHY PEOPLE CAN'T FOCUS */}
      <section className="relative z-10 border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="label mb-4">§ 01 · WHY PEOPLE AROUND THE WORLD CAN'T FOCUS</div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl max-w-3xl">
            Six structural reasons your focus broke — and why it isn't your fault.
          </h2>
          <div className="mt-12 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
            {STRUGGLES.map((s) => (
              <div key={s.h} className="bg-background p-6">
                <h3 className="font-display text-xl font-bold">{s.h}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GLOBAL DATA */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="label mb-4">§ 02 · EIGHT COUNTRIES · ONE PATTERN</div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Distraction is structural, not personal.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Every operating system, app and notification has been tuned for engagement,
            not output. The numbers look the same in every timezone.
          </p>
          <div className="mt-12 grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {REGIONS.map((r) => (
              <div key={r.place} className="bg-background p-6">
                <div className="label">{r.place}</div>
                <div className="mt-3 mono text-2xl font-bold">{r.stat}</div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{r.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 mono text-[10px] text-muted-foreground">
            Sources: DataReportal Digital 2025, Statista Mobile Index, Microsoft Work Trend Index.
          </p>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="relative z-10 border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="label mb-4">§ 03 · THE APP IN ONE PARAGRAPH</div>
              <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                A safe for your phone. Operated by your team.
              </h2>
            </div>
            <div className="md:col-span-7 space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                The Focus Vault turns your phone into a single-purpose terminal between
                9:00 and 17:00. The home screen displays one sentence — your daily
                objective — and nothing else. Notifications are dropped before they
                ever render.
              </p>
              <p>
                When the urge to escape becomes unbearable, you pay a <span className="stakes-crimson font-semibold">$20</span> break-glass
                fine and submit a reason. Ten teammates vote. Both conditions are
                required. There is no admin override and no support hotline that can
                let you out.
              </p>
              <Link to="/about" className="inline-block mono text-xs font-bold uppercase tracking-widest underline underline-offset-4">
                Read the full system →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW WE MAKE MONEY — PRICING */}
      <section id="pricing" className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="label mb-4">§ 04 · HOW THE FOCUS VAULT MAKES MONEY</div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl max-w-3xl">
            Transparent pricing. No ads. No data resale. No dark patterns.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            We charge for the lockdown itself and for the seats you add. The
            break-glass fine is what funds your team's voucher pool — it's a
            consequence, not a profit center.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`brutal-card flex flex-col p-8 ${p.accent ? "ring-amber" : ""}`}
              >
                <div className="label">{p.name}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold">{p.price}</span>
                  <span className="mono text-xs text-muted-foreground">{p.cadence}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.line}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="stakes-amber mono">→</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={p.cta.to}
                  className={`mt-8 inline-block w-full text-center brutal-border px-5 py-3 mono text-xs font-bold uppercase tracking-widest ${
                    p.accent
                      ? "bg-foreground text-background hover:opacity-90"
                      : "hover:bg-secondary"
                  }`}
                >
                  {p.cta.label} →
                </Link>
              </div>
            ))}
          </div>

          <div className="brutal-card mt-12 p-8">
            <div className="label mb-4">REVENUE MODEL · IN PLAIN ENGLISH</div>
            <ul className="grid gap-4 md:grid-cols-2">
              {REVENUE_LINES.map((r) => (
                <li key={r.k} className="flex gap-4">
                  <span className="stakes-amber mono text-xs font-bold uppercase tracking-widest min-w-[140px]">
                    {r.k}
                  </span>
                  <span className="text-sm text-muted-foreground">{r.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* EXPLORE */}
      <section className="relative z-10 border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="label mb-4">§ 05 · DIG IN</div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { to: "/videos" as const, t: "Watch the films", d: "Short documentaries on the global attention crisis and what kiosk-grade focus looks like in practice." },
              { to: "/blog" as const, t: "Read the research", d: "Essays on attention residue, kernel-level distraction blocking, and team-enforced accountability." },
              { to: "/partner" as const, t: "Become a partner", d: "Companies, coaches and creators: deploy The Focus Vault to your community." },
            ].map((c) => (
              <Link key={c.to} to={c.to} className="brutal-card group p-8">
                <h3 className="font-display text-2xl font-bold group-hover:stakes-amber">{c.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
                <div className="mt-6 mono text-xs font-bold uppercase tracking-widest underline underline-offset-4">
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
            Willpower failed. Try architecture.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-block brutal-border bg-foreground px-10 py-5 mono text-sm font-bold uppercase tracking-widest text-background hover:opacity-90"
            >
              Lock myself in · $50/yr
            </Link>
            <Link
              to="/waitlist"
              className="inline-block brutal-border px-10 py-5 mono text-sm font-bold uppercase tracking-widest hover:bg-secondary"
            >
              Join the waitlist
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
