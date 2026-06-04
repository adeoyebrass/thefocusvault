import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings · Focus Vault" }, { name: "robots", content: "noindex" }] }),
});

function SettingsPage() {
  const { user, verified, loading, signOut } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const update = useServerFn(updateMyProfile);

  useEffect(() => {
    if (!loading && (!user || !verified)) nav({ to: "/login", replace: true });
  }, [user, verified, loading, nav]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
    enabled: !!user,
  });

  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.display_name) setName(profile.display_name);
  }, [profile?.display_name]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await update({ data: { display_name: name.trim() } });
    qc.invalidateQueries({ queryKey: ["my-profile"] });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function resetPassword() {
    if (!user?.email) return;
    setPwBusy(true);
    setPwMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setPwMsg(error ? error.message : "Password reset email sent.");
    setPwBusy(false);
  }

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        <div className="label mb-3">§ 05 · SETTINGS</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Account & preferences</h1>

        <div className="mt-8 space-y-6">
          <form onSubmit={save} className="brutal-card p-6">
            <div className="label mb-3">PROFILE</div>
            <div className="grid gap-4">
              <label className="block">
                <span className="label">DISPLAY NAME</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full brutal-border bg-background px-3 py-2 outline-none"
                  maxLength={60}
                />
              </label>
              <div>
                <span className="label">EMAIL</span>
                <div className="mt-1 mono text-sm">{user?.email}</div>
              </div>
            </div>
            <button className="mt-4 brutal-border bg-foreground px-5 py-2 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90">
              {saved ? "Saved ✓" : "Save changes"}
            </button>
          </form>

          <div className="brutal-card p-6">
            <div className="label mb-3">APPEARANCE</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-sm font-bold">Theme</div>
                <div className="mono text-[10px] text-muted-foreground">Switch between dark and light mode.</div>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <div className="brutal-card p-6">
            <div className="label mb-3">VERIFICATION</div>
            <div className="mono text-xs">
              {profile?.face_verified_at
                ? <span className="stakes-amber">✓ Face verified · {new Date(profile.face_verified_at).toLocaleDateString()}</span>
                : <span className="stakes-crimson">Face not verified yet.</span>}
            </div>
            {!profile?.face_verified_at && (
              <button
                onClick={() => nav({ to: "/verify-face" })}
                className="mt-3 brutal-border px-4 py-2 mono text-xs font-bold uppercase tracking-widest hover:bg-secondary"
              >
                Verify now →
              </button>
            )}
          </div>

          <div className="brutal-card p-6">
            <div className="label mb-3">SECURITY</div>
            <button
              onClick={resetPassword}
              disabled={pwBusy}
              className="brutal-border px-4 py-2 mono text-xs font-bold uppercase tracking-widest hover:bg-secondary disabled:opacity-50"
            >
              {pwBusy ? "Sending…" : "Send password reset email"}
            </button>
            {pwMsg && <div className="mt-2 mono text-xs text-muted-foreground">{pwMsg}</div>}
          </div>

          <div className="brutal-card p-6 ring-crimson">
            <div className="label stakes-crimson mb-3">DANGER ZONE</div>
            <button
              onClick={signOut}
              className="brutal-border bg-stakes-crimson px-4 py-2 mono text-xs font-bold uppercase tracking-widest"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
