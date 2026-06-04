import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import { FaceCapture } from "@/components/FaceCapture";
import { getMyProfile, markFaceVerified } from "@/lib/profile.functions";

export const Route = createFileRoute("/verify-face")({
  component: VerifyFacePage,
  head: () => ({ meta: [{ title: "Verify · Focus Vault" }, { name: "robots", content: "noindex" }] }),
});

function VerifyFacePage() {
  const { user, verified, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const mark = useServerFn(markFaceVerified);

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
    enabled: !!user && verified,
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !verified)) nav({ to: "/login", replace: true });
  }, [user, verified, loading, nav]);

  useEffect(() => {
    if (profile?.face_verified_at) nav({ to: "/huddle", replace: true });
  }, [profile, nav]);

  function onCapture(b: Blob) {
    setBlob(b);
    setPreview(URL.createObjectURL(b));
  }

  async function submit() {
    if (!blob || !user) return;
    setBusy(true);
    setErr(null);
    try {
      const path = `${user.id}/selfie-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("face-verifications")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      await mark({ data: { path } });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      nav({ to: "/huddle", replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-2xl px-6 py-12">
        <div className="label mb-3">§ HUMAN CHECK</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Prove you're real.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          One quick selfie keeps bots and throwaway accounts out of the Vault. The image is stored privately —
          only you and Vault staff can ever see it.
        </p>

        <div className="mt-8 brutal-card p-6">
          {!preview ? (
            <FaceCapture onCapture={onCapture} />
          ) : (
            <div className="space-y-3">
              <img
                src={preview}
                alt="Your selfie preview"
                className="aspect-square w-full max-w-sm object-cover brutal-border"
              />
              {err && <div className="stakes-crimson mono text-xs">{err}</div>}
              <div className="flex gap-3">
                <button
                  onClick={() => { setPreview(null); setBlob(null); }}
                  className="flex-1 brutal-border py-3 mono text-xs font-bold uppercase tracking-widest hover:bg-secondary"
                >
                  Retake
                </button>
                <button
                  onClick={submit}
                  disabled={busy}
                  className="flex-1 brutal-border bg-foreground py-3 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Uploading…" : "Submit & enter Vault"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
