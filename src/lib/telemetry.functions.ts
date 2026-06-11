import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TelemetryRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  last_event: { event_type: "locked" | "unlocked"; created_at: string } | null;
  active_room: { id: string; title: string } | null;
  violation_flags: number;
  status: "locked" | "unlocked" | "offline";
};

export const getTelemetryGrid = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TelemetryRow[]> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Admin only.");

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, email")
      .limit(200);

    const ids = (profiles ?? []).map((p) => p.user_id);
    if (ids.length === 0) return [];

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowMs = Date.now();
    const offlineThresholdMs = 5 * 60 * 1000;

    const [{ data: events }, { data: rooms }, { data: parts }, { data: sessions }] = await Promise.all([
      supabaseAdmin
        .from("lock_events")
        .select("user_id, event_type, created_at")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabaseAdmin
        .from("focus_rooms")
        .select("id, title, starts_at, ends_at, is_active")
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .gte("ends_at", new Date().toISOString()),
      supabaseAdmin
        .from("focus_room_participants")
        .select("room_id, user_id")
        .in("user_id", ids),
      supabaseAdmin
        .from("focus_sessions")
        .select("user_id, ended_at, started_at")
        .in("user_id", ids)
        .gte("started_at", since30),
    ]);

    const latestEvent = new Map<string, { event_type: "locked" | "unlocked"; created_at: string }>();
    for (const e of events ?? []) {
      if (!latestEvent.has(e.user_id)) {
        latestEvent.set(e.user_id, { event_type: e.event_type as "locked" | "unlocked", created_at: e.created_at });
      }
    }

    const activeRoomIds = new Set((rooms ?? []).map((r) => r.id));
    const userRoom = new Map<string, { id: string; title: string }>();
    for (const p of parts ?? []) {
      if (activeRoomIds.has(p.room_id)) {
        const r = (rooms ?? []).find((x) => x.id === p.room_id);
        if (r) userRoom.set(p.user_id, { id: r.id, title: r.title });
      }
    }

    const violations = new Map<string, number>();
    for (const s of sessions ?? []) {
      // count abandoned sessions (started but not ended) as violations
      if (!s.ended_at) violations.set(s.user_id, (violations.get(s.user_id) ?? 0) + 1);
    }

    return (profiles ?? []).map((p) => {
      const last = latestEvent.get(p.user_id) ?? null;
      let status: "locked" | "unlocked" | "offline" = "offline";
      if (last) {
        const age = nowMs - new Date(last.created_at).getTime();
        if (age > offlineThresholdMs) status = "offline";
        else status = last.event_type === "locked" ? "locked" : "unlocked";
      }
      return {
        user_id: p.user_id,
        display_name: p.display_name,
        email: p.email,
        last_event: last,
        active_room: userRoom.get(p.user_id) ?? null,
        violation_flags: violations.get(p.user_id) ?? 0,
        status,
      };
    });
  });

export const forceLockState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    const v = d as { user_id?: unknown; action?: unknown };
    if (typeof v.user_id !== "string") throw new Error("user_id required");
    if (v.action !== "lock" && v.action !== "unlock" && v.action !== "ping") {
      throw new Error("invalid action");
    }
    return { user_id: v.user_id, action: v.action } as {
      user_id: string;
      action: "lock" | "unlock" | "ping";
    };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Admin only.");

    if (data.action === "ping") return { ok: true };

    const { error } = await supabaseAdmin.from("lock_events").insert({
      user_id: data.user_id,
      event_type: data.action === "lock" ? "locked" : "unlocked",
      note: `admin:${userId}`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
