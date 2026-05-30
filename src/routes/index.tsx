import { createFileRoute, Link } from "@tanstack/react-router";
import { VaultNav } from "@/components/VaultNav";
import { SiteFooter } from "@/components/SiteFooter";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "The Focus Vault — The world is losing its attention. Take yours back." },
      { name: "description", content: "The Focus Vault is a kiosk-grade phone lockdown for deep work. Learn about the global focus crisis, watch the films, read the research, and lock yourself in." },
      { property: "og:title", content: "The Focus Vault — Take your attention back" },
      { property: "og:description", content: "Kiosk-grade phone lockdown. 9-5 hard lock. $20 break-glass + team vouchers." },
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
              <Link to="/about" className="brutal-border bg-foreground px-6 py-4 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90">
                What is the Vault? →
              </Link>
              <Link to="/login" className="brutal-border bg-stakes-amber px-6 py-4 mono text-xs font-bold uppercase tracking-widest hover:opacity-90">
                Lock yourself in → $10/mo
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

      {/* GLOBAL PROBLEM */}
      <section className="relative z-10 border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="label mb-4">§ 01 · THE GLOBAL FOCUS CRISIS</div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Eight countries. One identical pattern.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Distraction is no longer personal — it is structural. Every operating
            system, app and notification has been tuned for engagement, not output.
            The numbers look the same in every timezone.
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
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="label mb-4">§ 02 · THE APP IN ONE PARAGRAPH</div>
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              A safe for your phone. Operated by your team.
            </h2>
          </div>
          <div className="md:col-span-7 space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              The Focus Vault is a mobile app that turns your phone into a single-purpose
              terminal between 9:00 and 17:00. The home screen displays one sentence —
              your daily objective — and nothing else. The status bar disappears.
              Notifications are dropped at the kernel before they ever render.
            </p>
            <p>
              When the urge to escape becomes unbearable, you can pay a <span className="stakes-crimson font-semibold">$20</span> break-glass
              fine and submit a reason. Ten teammates vote. Both conditions are required.
              There is no admin override and no support hotline that can let you out.
            </p>
            <Link to="/about" className="inline-block mono text-xs font-bold uppercase tracking-widest underline underline-offset-4">
              Read the full system →
            </Link>
          </div>
        </div>
      </section>

      {/* EXPLORE */}
      <section className="relative z-10 border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="label mb-4">§ 03 · DIG IN</div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { to: "/videos", t: "Watch the films", d: "Short documentaries on the global attention crisis and what kiosk-grade focus looks like in practice." },
              { to: "/blog", t: "Read the research", d: "Essays on attention residue, kernel-level distraction blocking, and team-enforced accountability." },
              { to: "/partner", t: "Become a partner", d: "Companies, coaches and creators: deploy The Focus Vault to your community." },
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
          <Link
            to="/login"
            className="mt-10 inline-block brutal-border bg-foreground px-10 py-5 mono text-sm font-bold uppercase tracking-widest text-background hover:opacity-90"
          >
            Lock myself in → $10/mo
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
