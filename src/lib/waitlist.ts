import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const waitlistSchema = z.object({
  email: z.string().email().max(320),
  location: z.string().min(2).max(200),
});

export async function joinWaitlist(input: z.input<typeof waitlistSchema>) {
  const parsed = waitlistSchema.parse(input);
  const { error } = await supabase.from("waitlist").insert({
    email: parsed.email.toLowerCase(),
    location: parsed.location,
  });
  if (error) {
    if (error.code === "23505") throw new Error("This email is already on the waitlist.");
    throw new Error(error.message);
  }
  return { ok: true };
}
