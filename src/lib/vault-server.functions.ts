import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Team ----------
export const listMyTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roster } = await supabase
      .from("team_members")
      .select("id, member_id, created_at")
      .eq("lead_id", userId);
    const memberIds = (roster ?? []).map((r) => r.member_id);
    let profiles: Array<{ user_id: string; display_name: string | null; email: string | null }> = [];
    if (memberIds.length) {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", memberIds);
      profiles = data ?? [];
    }
    return (roster ?? []).map((r) => ({
      id: r.id,
      member_id: r.member_id,
      profile: profiles.find((p) => p.user_id === r.member_id) ?? null,
    }));
  });

export const addTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (!profile) throw new Error("No registered user with that email. They must sign up first.");
    if (profile.user_id === userId) throw new Error("You're already the lead.");
    const { error } = await supabase
      .from("team_members")
      .insert({ lead_id: userId, member_id: profile.user_id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("team_members").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Vouch ----------
export const createVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ reason: z.string().min(10).max(2000), required_yes: z.number().int().min(1).max(20).default(3) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("vouch_votes")
      .insert({ owner_id: userId, reason: data.reason, required_yes: data.required_yes })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const getVote = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: vote, error } = await supabase
      .from("vouch_votes")
      .select("id, owner_id, reason, status, required_yes, created_at, resolved_at")
      .eq("id", data.id)
      .single();
    if (error || !vote) throw new Error("Vote not found or you're not authorized.");
    const { data: owner } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", vote.owner_id)
      .maybeSingle();
    const { data: responses } = await supabase
      .from("vouch_responses")
      .select("decision, voucher_id, comment, created_at")
      .eq("vote_id", vote.id);
    const yes = (responses ?? []).filter((r) => r.decision === "yes").length;
    const no = (responses ?? []).filter((r) => r.decision === "no").length;
    const myResponse = (responses ?? []).find((r) => r.voucher_id === userId) ?? null;
    return { vote, owner, yes, no, myResponse, isOwner: vote.owner_id === userId };
  });

export const respondToVote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      vote_id: z.string().uuid(),
      decision: z.enum(["yes", "no"]),
      comment: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("vouch_responses").upsert(
      { vote_id: data.vote_id, voucher_id: userId, decision: data.decision, comment: data.comment ?? null },
      { onConflict: "vote_id,voucher_id" },
    );
    if (error) throw new Error(error.message);
    // Tally and maybe resolve
    const { data: v } = await supabase
      .from("vouch_votes")
      .select("required_yes, status")
      .eq("id", data.vote_id)
      .single();
    const { data: resp } = await supabase
      .from("vouch_responses")
      .select("decision")
      .eq("vote_id", data.vote_id);
    const yes = (resp ?? []).filter((r) => r.decision === "yes").length;
    const no = (resp ?? []).filter((r) => r.decision === "no").length;
    if (v && v.status === "pending") {
      if (yes >= (v.required_yes ?? 3)) {
        await supabase
          .from("vouch_votes")
          .update({ status: "approved", resolved_at: new Date().toISOString() })
          .eq("id", data.vote_id);
      } else if (no >= (v.required_yes ?? 3)) {
        await supabase
          .from("vouch_votes")
          .update({ status: "denied", resolved_at: new Date().toISOString() })
          .eq("id", data.vote_id);
      }
    }
    return { ok: true };
  });

export const listMyPendingVotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // Votes from anyone whose roster I'm on, plus my own
    const { data: rosters } = await supabase
      .from("team_members")
      .select("lead_id")
      .eq("member_id", userId);
    const leadIds = (rosters ?? []).map((r) => r.lead_id);
    const ownerIds = Array.from(new Set([userId, ...leadIds]));
    const { data: votes } = await supabase
      .from("vouch_votes")
      .select("id, owner_id, reason, status, created_at, required_yes")
      .in("owner_id", ownerIds)
      .order("created_at", { ascending: false })
      .limit(50);
    return votes ?? [];
  });

// ---------- Admin analytics ----------
export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Admin only.");
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [{ count: users }, { count: sessions }, { count: votes }, { data: pending }] =
      await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("focus_sessions")
          .select("*", { count: "exact", head: true })
          .gte("started_at", since),
        supabase.from("vouch_votes").select("*", { count: "exact", head: true }).gte("created_at", since),
        supabase
          .from("vouch_votes")
          .select("id, reason, owner_id, created_at, required_yes")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
    return {
      users: users ?? 0,
      sessionsLast7d: sessions ?? 0,
      votesLast7d: votes ?? 0,
      pending: pending ?? [],
    };
  });
