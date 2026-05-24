import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
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

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: unknown;
          mode?: "huddle" | "prescreen";
        };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const system = body.mode === "prescreen" ? PRESCREEN_SYSTEM : HUDDLE_SYSTEM;

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
        });
      },
    },
  },
});
