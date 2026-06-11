import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, avatar_url, face_verified_at, face_image_path")
      .eq("user_id", userId)
      .maybeSingle();
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      display_name: z.string().trim().min(1).max(60).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: data.display_name })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markFaceVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1).max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const prefix = `${userId}/`;
    if (!data.path.startsWith(prefix)) {
      throw new Error("Forbidden: path does not belong to you.");
    }
    const filename = data.path.slice(prefix.length);
    if (!filename || filename.includes("/") || filename.includes("..")) {
      throw new Error("Forbidden: invalid file path.");
    }
    // Verify file exists in storage under the user's prefix using admin client
    // (storage RLS is not strict enough here, and signed users may bypass list).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: files, error: listErr } = await supabaseAdmin.storage
      .from("face-verifications")
      .list(userId, { search: filename, limit: 100 });
    if (listErr) throw new Error("Storage check failed.");
    const exists = (files ?? []).some((f) => f.name === filename);
    if (!exists) throw new Error("Forbidden: uploaded file not found.");

    const { error } = await supabase
      .from("profiles")
      .update({ face_verified_at: new Date().toISOString(), face_image_path: data.path })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

