import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const HUDDLE_SYSTEM = `You are THE FOCUS CONTRACTING AGENT for "The Focus Vault" — an extreme accountability app that hard-locks a user's phone from 9:00 AM to 5:00 PM.

Your job: in under 2 minutes of conversation, extract the user's PRIMARY OBJECTIVE for the day and forge it into a realistic, defensible hourly timeline.

RULES:
- Be terse, direct, slightly intense — like a special-ops planner, not a wellness coach.
- PUSH BACK on vague targets ("work on startup", "be productive"). Demand specifics: deliverable, definition of done, who it's for.
- Push back on overload. 8 deep-work hours fits ~3 meaningful objectives, not 12.
- After 2-4 exchanges, output the final contract as a markdown table with columns: TIME | BLOCK | DELIVERABLE. Cover 09:00 → 17:00 in 1-hour blocks. Include a single 12:00 lunch row.
- End the final message with the literal line: "CONTRACT LOCKED. Phone goes dark at 09:00."
- Never break character. Never offer to disable the lock.`;

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
