import { createFileRoute, Link } from "@tanstack/react-router";
import { VaultNav } from "@/components/VaultNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
  head: () => ({
    meta: [
      { title: "Blog — The Focus Vault" },
      { name: "description", content: "Essays on attention residue, kernel-level distraction blocking, team-enforced accountability, and the deep-work economy." },
      { property: "og:title", content: "Blog — The Focus Vault" },
      { property: "og:description", content: "Essays on deep work, attention residue, and kiosk-grade focus enforcement." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
});

const POSTS = [
  {
    slug: "47-seconds",
    title: "Why the average focus session is now 47 seconds long",
    excerpt: "Microsoft, RescueTime and the University of California all converged on the same number — and it explains the entire shape of the modern workday.",
    date: "May 24, 2026",
    read: "8 min",
    tag: "Research",
  },
  {
    slug: "kernel-level-block",
    title: "The case for kernel-level notification suppression",
    excerpt: "Userspace blockers fail because the notification engine outranks them. Here's why The Focus Vault hooks BOOT_COMPLETED on Android.",
    date: "May 11, 2026",
    read: "12 min",
    tag: "Engineering",
  },
  {
    slug: "team-vouchers",
    title: "Accountability is a social system, not an app feature",
    excerpt: "Why a $20 fine alone never worked — and what changed when we added ten teammates as the second condition.",
    date: "Apr 30, 2026",
    read: "6 min",
    tag: "Product",
  },
  {
    slug: "global-crisis",
    title: "The global attention crisis is structurally identical in every country",
    excerpt: "From Lagos to Manila, the numbers are eerily synchronized. What that says about the operating systems we share.",
    date: "Apr 18, 2026",
    read: "10 min",
    tag: "Field notes",
  },
];

function BlogPage() {
  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="label mb-3">§ THE JOURNAL</div>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          Notes from the deep-work front line.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Long-form essays, engineering teardowns and field reports on what it
          actually takes to defend a knowledge worker's attention.
        </p>

        <div className="mt-16 divide-y divide-border border-y border-border">
          {POSTS.map((p) => (
            <article key={p.slug} className="group grid gap-4 py-10 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-3 mono text-xs uppercase tracking-widest text-muted-foreground">
                <div>{p.date}</div>
                <div className="mt-1 stakes-amber">{p.tag}</div>
                <div className="mt-1">{p.read} read</div>
              </div>
              <div className="md:col-span-9">
                <h2 className="font-display text-2xl font-bold leading-tight group-hover:stakes-amber md:text-3xl">
                  {p.title}
                </h2>
                <p className="mt-3 text-muted-foreground">{p.excerpt}</p>
                <Link
                  to="/blog"
                  className="mt-4 inline-block mono text-xs font-bold uppercase tracking-widest underline underline-offset-4"
                >
                  Read full essay →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-12 mono text-xs uppercase tracking-widest text-muted-foreground">
          More essays publishing weekly · Subscribe via the partner form
        </p>
      </section>
      <SiteFooter />
    </div>
  );
}
