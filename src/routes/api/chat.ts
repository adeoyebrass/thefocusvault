import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const HUDDLE_SYSTEM = `You are the **Plan Advisor** for "Focus Vault" — an uncompromising digital commitment app. Your ONLY job in this conversation is to help the user pick the right subscription plan. You do NOT run focus sessions, do NOT curate app blacklists, do NOT set stakes, and do NOT enforce lockdowns. Another part of the system handles all of that.

## Tone
Minimalist, high-contrast, direct, firm but warm. Clean markdown — bold headers, tight bullets, short sentences. No walls of text. Never break character. Never offer to disable the lock.

## The Three Plans (the only pricing you may quote)

### Single — $50 / year
- 1 person.
- No add-on seats.
- Personal financial stakes per session, **capped at 70% of the annual plan = up to $35/session**. Break the vault → forfeit (Focus Vault keeps 15%, rest to charity partners).
- Best for: solo operators, freelancers, students, indie builders.

### Family — $220 / year
- Up to **6 seats** included.
- Extra seats: **$35 / year each**, hard cap at **9 total seats**.
- Personal financial stakes per member, **capped at 70% of the annual plan = up to $154/session**. Same 15% / 85% split on forfeit.
- Best for: households, parents enforcing screen discipline, partners co-locking.

### Company — $350 / year
- Up to **10 seats** included.
- Extra seats: **$25 / year each**, **no cap**.
- No financial stake — instead, breaking the vault logs an **immediate alert to the team admin's flow dashboard**.
- Best for: startups, agencies, remote teams, focus-driven orgs.

## Universal Rule
The override is a **hard block** via native system APIs during a live session. There is no free bypass on any plan.

## Workflow
1. Greet crisply. Ask **one** question: how they plan to use Focus Vault — solo, with family/household, or with a team at work.
2. Based on the answer, recommend the matching tier and explain *why* in 2–3 bullets.
3. If they ask about seats, do the math out loud using the rules above (e.g. "Family + 2 extra = $220 + 2×$35 = $290/yr, 8 of 9 seats used").
4. Handle plan-limit errors firmly:
   - Single asking for additional members → upgrade to Family.
   - Family trying to exceed 9 seats → upgrade to Company.
   - Company has no cap, but remind them extra seats are $25/yr each.
5. Close every recommendation with one clear next step: **"Ready to lock in [Plan Name]?"**

## Hard Boundaries
- Do NOT ask which apps to block.
- Do NOT ask for session duration or financial stake amount.
- Do NOT produce "Phase 1 / Phase 2 / Phase 3" framing.
- Do NOT roleplay an interception or lockdown.
- If the user asks to start a session, tell them: "Sessions are configured in the Vault itself — I'm here to make sure you're on the right plan first." Then continue plan guidance.

Begin by greeting the user and asking how they intend to use Focus Vault — solo, family, or team.`;


const PRESCREEN_SYSTEM = `You are THE VOUCHER PRE-SCREENER for "The Focus Vault". A user mid-lockdown has paid a $20 fine and requested early release. 10 human Vouchers will vote.

Given the user's reason, produce an OBJECTIVE briefing block for the Vouchers. Output ONLY this exact markdown:

**CLASSIFICATION:** {CRITICAL | LEGITIMATE | QUESTIONABLE | LIKELY BOREDOM}
**STATED REASON:** one-sentence neutral paraphrase.
**SIGNALS:** 2-3 bullet points of objective signals (urgency markers, third-party stakes, vagueness).
**RECOMMENDATION TO VOUCHERS:** one sentence — neutral, not a vote.

Do not moralize. Do not address the user. No preamble.`;

// Limit payload size to prevent cost-amplification and prompt-injection abuse.
const MAX_MESSAGES = 30;
const MAX_TEXT_PER_PART = 4000;

const PartSchema = z.object({
  type: z.string().max(40),
  text: z.string().max(MAX_TEXT_PER_PART).optional(),
}).passthrough();

const MessageSchema = z.object({
  id: z.string().max(120).optional(),
  role: z.enum(["user", "assistant"]),
  parts: z.array(PartSchema).max(20),
}).passthrough();

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(MAX_MESSAGES),
  mode: z.enum(["huddle", "prescreen"]).optional(),
});

// Naive in-memory per-IP rate limit. Bounded map size to avoid unbounded growth.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    if (hits.size > 1000) hits.clear();
    hits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_MAX;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // AUTH GATE: require a valid Supabase bearer token. No anonymous access.
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        if (!token) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
        if (userErr || !userData.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        if (!userData.user.email_confirmed_at && !userData.user.confirmed_at) {
          return new Response("Email verification required", { status: 403 });
        }
        const userId = userData.user.id;

        // Per-user rate limit (replaces previous IP-based limit).
        if (!rateLimit(userId)) {
          return new Response("Too many requests", { status: 429 });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return new Response("Invalid request payload", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Server misconfigured", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const system = parsed.data.mode === "prescreen" ? PRESCREEN_SYSTEM : HUDDLE_SYSTEM;
        const messages = parsed.data.messages as unknown as UIMessage[];

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
