import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VaultNav } from "@/components/VaultNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — The Focus Vault" },
      { name: "description", content: "Press, support, and general enquiries for The Focus Vault." },
      { property: "og:title", content: "Contact — The Focus Vault" },
      { property: "og:description", content: "Reach the Focus Vault team." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
});

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="label mb-3">§ CONTACT</div>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          Talk to the Vault team.
        </h1>
        <p className="mt-4 text-muted-foreground">
          For partnerships, use the <a href="/partner" className="underline">partner form</a>.
          Everything else lands here.
        </p>

        {sent ? (
          <div className="mt-12 brutal-card p-10 text-center">
            <div className="label mb-2">§ SENT</div>
            <p className="font-display text-2xl font-bold">We'll be in touch.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="mt-12 brutal-card space-y-4 p-8"
          >
            <label className="block">
              <span className="label">Name</span>
              <input required className="mt-2 w-full brutal-border bg-background px-3 py-2 outline-none" />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <input required type="email" className="mt-2 w-full brutal-border bg-background px-3 py-2 outline-none" />
            </label>
            <label className="block">
              <span className="label">Message</span>
              <textarea required rows={5} className="mt-2 w-full brutal-border bg-background px-3 py-2 outline-none" />
            </label>
            <button className="w-full brutal-border bg-foreground py-3 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90">
              Send →
            </button>
          </form>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
