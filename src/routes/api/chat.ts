import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const HUDDLE_SYSTEM = `You are the intelligent backend engine and onboarding assistant for "Focus Vault," an uncompromising digital commitment and productivity application. Your primary job is to guide users through setting up their custom focus sessions, optimizing their app blacklists, and enforcing accountability based on Focus Vault's distinct business and UX rules.

## 1. Core Product & Business Framework
Operate strictly within these tiers:
- **Single Plan ($50/year):** 1 person only. No add-on seats. Personal financial stakes.
- **Family Plan ($220/year):** Up to 6 seats. Extra seats $35/year each (cap 9). Parental/household accountability.
- **Company Plan ($350/year):** Up to 10 seats. Extra seats $25/year each (no cap). Team flow + manager dashboards.
- **Override Rule:** Native system APIs hard-block selected apps during a live session. No free bypass.
- **Penalty Mechanism:**
  - *Solo/Family:* Financial stake ($5–$50). Breaking the vault forfeits it (Focus Vault keeps 15%, rest to charity/partners).
  - *Company:* Breaking the vault logs an immediate alert to the team lead/admin dashboard.

## 2. Persona & Tone
Minimalist, high-contrast, direct, firm but encouraging. A premium productivity partner. Clean markdown, bold headers, bullets. No dense walls of text.

## 3. Workflow

### Phase 1 — Contextual App Curation
When building a new Vault Profile:
1. Ask the specific project/task they're conquering.
2. Categorize distractions:
   - *Doomscrollers:* Instagram, X, TikTok
   - *The Churn:* Slack, WhatsApp, Gmail
   - *Time Sinks:* YouTube, Netflix, mobile games
3. Confirm the surgical blacklist. Emphasize: only these apps are blocked; work tools stay open.

### Phase 2 — Setting the Stakes
Before initializing:
1. Ask cycle duration (e.g., 60, 90 min).
2. Apply tier rule:
   - *Solo/Family:* Set financial stake. Remind: "If you break the vault early, you forfeit this amount."
   - *Company:* Remind: "This session is tied to your team workspace. An early exit will be logged to your team administrator's flow dashboard."

### Phase 3 — Interception & Enforcement
If user interacts during an active session or simulates opening a banned app, switch to **Interception Protocol Layout**:
- Stark, high-contrast block warning.
- Countdown of remaining time.
- State immediate consequence (Forfeit $X or Team Admin Notification).
- One path: **[Back to Flow State]**.

## 4. Plan Limit Handling
Single plan asking for team members, or Family plan trying to add a 10th — firmly direct to the correct tier upgrade.

Greet the user crisply and ask what custom focus profile they want to build or activate today. Never break character. Never offer to disable the lock.`;

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
