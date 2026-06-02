import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in · The Focus Vault" }, { name: "robots", content: "noindex" }] }),
});

function LoginPage() {
  const nav = useNavigate();
  const { user, verified, signOut } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && verified) nav({ to: "/team" });
  }, [user, verified, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setNotice("Check your email to verify the account before entering the Vault app.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user?.email_confirmed_at && !data.user?.confirmed_at) {
          await supabase.auth.signOut();
          setErr("Verify your email before entering the Vault app.");
        }
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Auth failed");
    }
    setBusy(false);
  }

  async function google() {
    setBusy(true);
    setErr(null);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setErr(r.error instanceof Error ? r.error.message : String(r.error));
    setBusy(false);
  }

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:items-center">
        {/* LEFT — Logo + pitch */}
        <div className="order-2 md:order-1">
          <img
            src={logo}
            alt="The Focus Vault logo"
            className="mb-8 h-40 w-40 brutal-border bg-background p-3"
          />
          <div className="label mb-3">§ WHAT IS THE FOCUS VAULT</div>
          <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
            A kiosk-grade lockdown for your phone — between 9 and 5.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            The Focus Vault is a deep-work operating layer. From the moment your
            shift begins, the device draws one screen: your daily objective. No
            feeds, no badges, no banners. Notifications are dropped at the kernel.
            To break out early you pay <span className="stakes-crimson font-semibold">$20</span> and convince <span className="stakes-crimson font-semibold">your team</span> the emergency is real.
          </p>
          <ul className="mt-6 space-y-2 mono text-xs uppercase tracking-widest text-muted-foreground">
            <li>→ 8-hour hard-lock, boot-persistent</li>
            <li>→ AI huddle that interrogates vague goals</li>
            <li>→ Team-vouched break-glass, no backdoors</li>
            <li>→ $10/mo · cancel anytime</li>
          </ul>
        </div>

        {/* RIGHT — Auth form */}
        <div className="order-1 md:order-2 max-w-md w-full md:justify-self-end">
          <div className="label mb-3">§ AUTH · KIOSK ACCESS</div>
          <h1 className="font-display text-4xl font-bold">
            {mode === "signup" ? "Forge your contract." : "Step into the Vault."}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Only verified accounts can enter the mobile-style Vault app, join teams, vouch, or break glass.
          </p>

          {user && !verified && (
            <div className="mt-6 brutal-card p-4 ring-amber">
              <div className="label stakes-amber mb-2">VERIFY EMAIL REQUIRED</div>
              <p className="text-sm text-muted-foreground">
                Confirm your email first. The app stays hidden until verification is complete.
              </p>
              <button onClick={signOut} className="mt-3 label hover:text-foreground">Use a different account →</button>
            </div>
          )}

          <button
            onClick={google}
            disabled={busy}
            className="mt-8 w-full brutal-border bg-foreground py-3 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90 disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="label">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display name"
                className="w-full brutal-border bg-background px-3 py-2 outline-none"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full brutal-border bg-background px-3 py-2 outline-none"
            />
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8)"
              className="w-full brutal-border bg-background px-3 py-2 outline-none"
            />
            {notice && <div className="stakes-amber mono text-xs">{notice}</div>}
            {err && <div className="stakes-crimson mono text-xs">{err}</div>}
            <button
              disabled={busy}
              className="w-full brutal-border bg-stakes-amber py-3 mono text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 label hover:text-foreground"
          >
            {mode === "signin" ? "Don't have an account? Sign up →" : "Already locked in? Sign in →"}
          </button>
        </div>
      </div>
    </div>
  );
}
