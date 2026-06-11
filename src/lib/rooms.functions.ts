import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RoomTypeSchema = z.enum(["extension", "ephemeral"]);

export const listMyRooms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: rooms } = await supabase
      .from("focus_rooms")
      .select("id, title, type, starts_at, ends_at, is_active, owner_id, created_at")
      .eq("owner_id", userId)
      .order("starts_at", { ascending: false })
      .limit(50);
    const ids = (rooms ?? []).map((r) => r.id);
    let parts: Array<{ room_id: string; user_id: string }> = [];
    let profiles: Array<{ user_id: string; display_name: string | null; email: string | null }> = [];
    if (ids.length) {
      const { data: p } = await supabase
        .from("focus_room_participants")
        .select("room_id, user_id")
        .in("room_id", ids);
      parts = p ?? [];
      const userIds = Array.from(new Set(parts.map((x) => x.user_id)));
      if (userIds.length) {
        const { data: pr } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", userIds);
        profiles = pr ?? [];
      }
    }
    return (rooms ?? []).map((r) => ({
      ...r,
      participants: parts
        .filter((p) => p.room_id === r.id)
        .map((p) => ({
          user_id: p.user_id,
          profile: profiles.find((pr) => pr.user_id === p.user_id) ?? null,
        })),
    }));
  });

export const createRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(1).max(120),
        type: RoomTypeSchema,
        starts_at: z.string().datetime(),
        ends_at: z.string().datetime(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (new Date(data.ends_at) <= new Date(data.starts_at)) {
      throw new Error("End time must be after start time.");
    }
    const { data: row, error } = await supabase
      .from("focus_rooms")
      .insert({
        owner_id: userId,
        title: data.title,
        type: data.type,
        starts_at: data.starts_at,
        ends_at: data.ends_at,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const addParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ room_id: z.string().uuid(), email: z.string().email().max(255) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: room } = await supabase
      .from("focus_rooms")
      .select("id, owner_id")
      .eq("id", data.room_id)
      .maybeSingle();
    if (!room || room.owner_id !== userId) throw new Error("Not your room.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (!profile) throw new Error("No registered user with that email.");
    const { error } = await supabase
      .from("focus_room_participants")
      .insert({ room_id: data.room_id, user_id: profile.user_id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ room_id: z.string().uuid(), user_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("focus_room_participants")
      .delete()
      .eq("room_id", data.room_id)
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const closeRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("focus_rooms")
      .update({ is_active: false })
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
