import { createFileRoute, Link } from "@tanstack/react-router";
import { VaultNav } from "@/components/VaultNav";
import { SiteFooter } from "@/components/SiteFooter";
import logoAsset from "@/assets/logo.png.asset.json";
const logo = logoAsset.url;

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — The Focus Vault" },
      { name: "description", content: "How The Focus Vault works: kernel-level notification suppression, 9-5 hard lock, $20 break-glass fine, and team-enforced vouching." },
      { property: "og:title", content: "About — The Focus Vault" },
      { property: "og:description", content: "Kernel-level focus enforcement for deep work." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
});

function AboutPage() {
  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex items-start gap-8">
          <img src={logo} alt="The Focus Vault" className="hidden h-24 w-24 brutal-border bg-background p-2 md:block" />
          <div>
            <div className="label mb-3">§ ABOUT THE APP</div>
            <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
              The app is the rule. There is no negotiation layer.
            </h1>
          </div>
        </div>

        <div className="mt-12 space-y-10 text-lg leading-relaxed text-muted-foreground">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Environmental isolation, not willpower.</h2>
            <p className="mt-3">
              Modern productivity apps assume the user is the strongest agent in the room.
              They are not. The notification engine is. The Focus Vault inverts the relationship —
              the device cooperates with the future-self, not the present-self.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">The 9-to-5 hard lock.</h2>
            <p className="mt-3">
              Set the window once, at setup. Once active, the lock survives reboots,
              force-quits and OS updates. The home screen is rewritten to display a single sentence:
              your daily objective. The status bar is suppressed. Notifications are hard-dropped at the kernel.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">$20 break-glass + team vouchers.</h2>
            <p className="mt-3">
              You can break out early. It costs $20 and you must submit a written reason that
              ten teammates vote on. Both conditions are required. There is no admin override.
              No "lost password" path. No support ticket that can let you out.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">The Gemini layer.</h2>
            <p className="mt-3">
              A 2-minute pre-lock huddle interrogates vague goals and forges a defensible hourly plan.
              A voucher pre-screener converts panic into objective briefings. An anti-churn analyzer
              flags repeat overrides for a warm-up tier — before users cancel.
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-4">
          <Link to="/login" className="brutal-border bg-stakes-amber px-6 py-4 mono text-xs font-bold uppercase tracking-widest">
            Sign the contract → $10/mo
          </Link>
          <Link to="/videos" className="brutal-border px-6 py-4 mono text-xs font-bold uppercase tracking-widest hover:bg-secondary">
            Watch the films
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
