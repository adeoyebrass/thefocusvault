import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Record a lock/unlock event for the current user.
export const recordLockEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      event_type: z.enum(["locked", "unlocked"]),
      note: z.string().max(200).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("lock_events")
      .insert({ user_id: userId, event_type: data.event_type, note: data.note ?? null });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Lead view: latest lock state per roster member.
export const getTeamLockStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roster } = await supabase
      .from("team_members")
      .select("member_id")
      .eq("lead_id", userId);
    const ids = (roster ?? []).map((r) => r.member_id);
    if (ids.length === 0) return [];

    const [{ data: events }, { data: profiles }] = await Promise.all([
      supabase
        .from("lock_events")
        .select("user_id, event_type, created_at")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", ids),
    ]);

    return ids.map((id) => {
      const last = (events ?? []).find((e) => e.user_id === id);
      const profile = (profiles ?? []).find((p) => p.user_id === id) ?? null;
      return {
        member_id: id,
        profile,
        last_event: last ?? null,
        is_locked: last?.event_type === "locked",
      };
    });
  });

// Lead sends a reminder to a roster member.
export const sendLockReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      member_id: z.string().uuid(),
      message: z.string().min(2).max(500),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("team_reminders")
      .insert({ lead_id: userId, member_id: data.member_id, message: data.message });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Member view: unread reminders.
export const listMyReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("team_reminders")
      .select("id, lead_id, message, read_at, created_at")
      .eq("member_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });

