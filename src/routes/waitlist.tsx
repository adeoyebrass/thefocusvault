import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { VaultNav } from "@/components/VaultNav";
import { SiteFooter } from "@/components/SiteFooter";
import { joinWaitlist } from "@/lib/waitlist";

export const Route = createFileRoute("/waitlist")({
  component: WaitlistPage,
  head: () => ({
    meta: [
      { title: "Join the waitlist · The Focus Vault" },
      { name: "description", content: "Get early access to The Focus Vault. Tell us where you focus from and we'll notify you when we open seats in your region." },
      { property: "og:title", content: "Join the Focus Vault waitlist" },
      { property: "og:description", content: "Early access to kiosk-grade phone lockdown. Limited seats per region." },
    ],
    links: [{ rel: "canonical", href: "/waitlist" }],
  }),
});

function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");
    try {
      await joinWaitlist({ email, location });
      setStatus("ok");
      setMsg("You're on the list. We'll be in touch when seats open in your region.");
      setEmail("");
      setLocation("");
    } catch (err) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <section className="relative z-10 mx-auto max-w-3xl px-6 py-20">
        <div className="label mb-4">§ WAITLIST</div>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          Seats open by region.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          The Focus Vault rolls out city-by-city to keep voucher pools tight and
          local. Drop your email and where you focus from — we'll notify you the
          moment we open seats in your region.
        </p>

        <form onSubmit={onSubmit} className="brutal-card mt-12 p-8 space-y-5">
          <label className="block">
            <span className="label">EMAIL</span>
            <input
              type="email"
              required
              maxLength={320}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full brutal-border bg-background px-4 py-3 text-base outline-none"
            />
          </label>
          <label className="block">
            <span className="label">LOCATION · CITY, COUNTRY</span>
            <input
              type="text"
              required
              minLength={2}
              maxLength={200}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lagos, Nigeria"
              className="mt-2 w-full brutal-border bg-background px-4 py-3 text-base outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full brutal-border bg-foreground px-6 py-4 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90 disabled:opacity-50"
          >
            {status === "loading" ? "Submitting…" : "Reserve my seat →"}
          </button>
          {msg && (
            <div className={`mono text-xs ${status === "ok" ? "stakes-amber" : "stakes-crimson"}`}>
              {msg}
            </div>
          )}
        </form>

        <p className="mt-8 text-sm text-muted-foreground">
          Already have access? <Link to="/login" className="underline">Sign in →</Link>
        </p>
      </section>
      <SiteFooter />
    </div>
  );
}
