import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in · The Focus Vault" }, { name: "robots", content: "noindex" }] }),
});

function LoginPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/team" });
  }, [user, nav]);

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
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
      <div className="relative z-10 mx-auto max-w-md px-6 py-16">
        <div className="label mb-3">§ AUTH · KIOSK ACCESS</div>
        <h1 className="font-display text-4xl font-bold">
          {mode === "signup" ? "Forge your contract." : "Step into the Vault."}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You need an account to be added to a team, to vouch for someone, or to break glass.
        </p>

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
  );
}
