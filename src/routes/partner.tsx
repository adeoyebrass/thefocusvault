import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VaultNav } from "@/components/VaultNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/partner")({
  component: PartnerPage,
  head: () => ({
    meta: [
      { title: "Partner with us — The Focus Vault" },
      { name: "description", content: "Companies, coaches, accelerators and creators: deploy The Focus Vault to your community. Apply to become a launch partner." },
      { property: "og:title", content: "Partner with us — The Focus Vault" },
      { property: "og:description", content: "Become a Focus Vault launch partner — for teams, coaches and creators." },
      { property: "og:url", content: "/partner" },
    ],
    links: [{ rel: "canonical", href: "/partner" }],
  }),
});

function PartnerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    org: "",
    email: "",
    role: "Coach / consultant",
    audience: "",
    why: "",
  });

  function onChange<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Front-end only for now. Wire to a server function or email when ready.
    console.log("partner_application", form);
    setSubmitted(true);
  }

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="label mb-3">§ PARTNER PROGRAM</div>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          Deploy The Focus Vault to your people.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Accelerators, coaches, agencies, creator collectives and ops teams use
          The Focus Vault as the enforcement layer behind their deep-work programs.
          Apply below — we onboard a small number of partners every month.
        </p>

        <div className="mt-12 grid gap-12 md:grid-cols-12">
          <ul className="md:col-span-4 space-y-4 mono text-xs uppercase tracking-widest text-muted-foreground">
            <li>→ Co-branded onboarding flow</li>
            <li>→ Team dashboards & vouch quorum</li>
            <li>→ Revenue share on referred seats</li>
            <li>→ Direct line to the founding team</li>
            <li>→ Early access to new lock primitives</li>
          </ul>

          <div className="md:col-span-8">
            {submitted ? (
              <div className="brutal-card p-10 text-center">
                <div className="label mb-2">§ RECEIVED</div>
                <h2 className="font-display text-3xl font-bold">Application logged.</h2>
                <p className="mt-3 text-muted-foreground">
                  We review every partner application personally. Expect a reply
                  within 5 business days from <span className="mono">partners@focusvault.app</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="brutal-card space-y-4 p-8">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="label">Your name</span>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      className="mt-2 w-full brutal-border bg-background px-3 py-2 outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="label">Organization</span>
                    <input
                      required
                      value={form.org}
                      onChange={(e) => onChange("org", e.target.value)}
                      className="mt-2 w-full brutal-border bg-background px-3 py-2 outline-none"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="label">Work email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    className="mt-2 w-full brutal-border bg-background px-3 py-2 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="label">Role</span>
                  <select
                    value={form.role}
                    onChange={(e) => onChange("role", e.target.value)}
                    className="mt-2 w-full brutal-border bg-background px-3 py-2 outline-none"
                  >
                    <option>Coach / consultant</option>
                    <option>Accelerator / fund</option>
                    <option>Agency / studio</option>
                    <option>Creator / community lead</option>
                    <option>In-house ops / people team</option>
                  </select>
                </label>
                <label className="block">
                  <span className="label">Audience size</span>
                  <input
                    required
                    value={form.audience}
                    onChange={(e) => onChange("audience", e.target.value)}
                    placeholder="e.g. 50 founders, 2 000 newsletter subs"
                    className="mt-2 w-full brutal-border bg-background px-3 py-2 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="label">Why The Focus Vault?</span>
                  <textarea
                    required
                    rows={4}
                    value={form.why}
                    onChange={(e) => onChange("why", e.target.value)}
                    placeholder="What problem are you solving for your people that the Vault would enforce?"
                    className="mt-2 w-full brutal-border bg-background px-3 py-2 outline-none"
                  />
                </label>
                <button className="w-full brutal-border bg-foreground py-3 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90">
                  Submit application →
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
