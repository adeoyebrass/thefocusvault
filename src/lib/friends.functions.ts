import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireVerified(supabase: { auth: { getUser: () => Promise<{ data: { user: { email_confirmed_at?: string | null; confirmed_at?: string | null } | null }; error: unknown }> } }) {
  const { data, error } = await supabase.auth.getUser();
  if (error || (!data.user?.email_confirmed_at && !data.user?.confirmed_at)) {
    throw new Error("Email verification required.");
  }
}

type Profile = { user_id: string; display_name: string | null; email: string | null; avatar_url?: string | null };

export const listMyFriends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireVerified(supabase);
    const { data: rows } = await supabase
      .from("friendships")
      .select("id, requester_id, recipient_id, status, created_at")
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    const list = rows ?? [];
    const otherIds = Array.from(new Set(list.map((r) => (r.requester_id === userId ? r.recipient_id : r.requester_id))));
    let profiles: Profile[] = [];
    if (otherIds.length) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, email, avatar_url")
        .in("user_id", otherIds);
      profiles = data ?? [];
    }
    return list.map((r) => {
      const otherId = r.requester_id === userId ? r.recipient_id : r.requester_id;
      return {
        id: r.id,
        status: r.status,
        direction: r.requester_id === userId ? "outgoing" : "incoming",
        other: profiles.find((p) => p.user_id === otherId) ?? { user_id: otherId, display_name: null, email: null },
        created_at: r.created_at,
      };
    });
  });

export const sendFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireVerified(supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (!profile) throw new Error("No registered user with that email.");
    if (profile.user_id === userId) throw new Error("You can't friend yourself.");
    // Check for existing edge in either direction
    const { data: existing } = await supabaseAdmin
      .from("friendships")
      .select("id, status, requester_id, recipient_id")
      .or(
        `and(requester_id.eq.${userId},recipient_id.eq.${profile.user_id}),and(requester_id.eq.${profile.user_id},recipient_id.eq.${userId})`,
      )
      .maybeSingle();
    if (existing) {
      if (existing.status === "accepted") throw new Error("Already friends.");
      if (existing.status === "pending") throw new Error("A request is already pending.");
      // declined -> allow reset by deleting
      await supabaseAdmin.from("friendships").delete().eq("id", existing.id);
    }
    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: userId, recipient_id: profile.user_id, status: "pending" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const respondFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), accept: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await requireVerified(supabase);
    const { error } = await supabase
      .from("friendships")
      .update({ status: data.accept ? "accepted" : "declined" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await requireVerified(supabase);
    const { error } = await supabase.from("friendships").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const pingFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      recipient_id: z.string().uuid(),
      kind: z.enum(["lock", "break_request"]),
      message: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireVerified(supabase);
    const { error } = await supabase
      .from("friend_pings")
      .insert({
        sender_id: userId,
        recipient_id: data.recipient_id,
        kind: data.kind,
        message: data.message ?? null,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyPings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await requireVerified(supabase);
    const { data: pings } = await supabase
      .from("friend_pings")
      .select("id, sender_id, kind, message, read_at, created_at")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    const list = pings ?? [];
    const ids = Array.from(new Set(list.map((p) => p.sender_id)));
    let profiles: Profile[] = [];
    if (ids.length) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", ids);
      profiles = data ?? [];
    }
    return list.map((p) => ({
      ...p,
      sender: profiles.find((x) => x.user_id === p.sender_id) ?? null,
    }));
  });

export const markPingRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await requireVerified(supabase);
    const { error } = await supabase
      .from("friend_pings")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
