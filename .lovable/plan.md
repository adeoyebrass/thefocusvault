
This is a multi-part build. I'll execute in this order:

## 1. Enable backend (Lovable Cloud)
Required for user accounts, vouch records, team rosters, and Stripe webhook persistence. No external setup for you.

## 2. Authentication
- Email + password and Google sign-in (Lovable Cloud defaults).
- `profiles` table (display_name, avatar_url) auto-created via trigger on signup.
- `/login` and `/signup` routes; `_authenticated` layout guard.
- Root `onAuthStateChange` for cache invalidation.

## 3. Vouch system (real, not demo)
- Tables:
  - `vouch_votes` — break-glass requests (owner_id, reason, status, created_at)
  - `vouch_responses` — one row per voucher decision (vote_id, voucher_id, decision, comment)
  - `team_members` — (lead_id, member_user_id, role) so a lead can add registered users to their roster who become eligible vouchers
- RLS:
  - vote owner reads their own votes; vouchers listed in `team_members` read pending votes addressed to them
  - vouchers insert/update only their own response row
- `/vouch/$voteId` becomes real: requires auth, looks up vote, lets the user cast yes/no, server-side tally → auto-resolves at quorum (e.g. 3 yes / majority of team)

## 4. Team management upgrade
- `/team` adds a "Add registered user by email" action that creates a `team_members` row only if a profile exists for that email.
- 5 free seats; extras = $2/seat/mo. Stored seat count drives Stripe billing.

## 5. Stripe billing (seamless, Lovable-managed)
- Run `recommend_payment_provider` → expect Stripe recommendation (SaaS subscription).
- Enable via `enable_stripe_payments`.
- Products: `Vault Base $10/mo` + metered `Extra Seat $2/seat/mo`.
- Server fn `createCheckoutSession({ extraSeats })`, webhook at `/api/public/stripe-webhook` upserts `subscriptions` table.
- "Enter · $10/mo" CTA and `/team` "Upgrade seats" button hit checkout.

## 6. Admin analytics / Voucher Console
New `/admin` route (gated by `role = 'admin'` via `user_roles` table + `has_role` security-definer function — never store role on profile).
Panels:
- Active vaults today, total focus-minutes, break-glass requests last 7d (sparkline)
- Voucher console table: pending votes with quick-approve/deny
- Revenue: MRR, active subs, extra-seat count (from `subscriptions` table)

## 7. Imagery
Generate and place:
- Hero image on `/` (focus/deep-work brutalist photo)
- Section image on `/huddle` (team huddle abstract)
- Section image on `/break-glass` (red-glass emergency motif)
- Section image on `/team` (people grid)
Use `imagegen` standard quality, save to `src/assets/`, import via ES6.

## Technical notes
- Auth: Lovable Cloud (Supabase under the hood), Google + email/password.
- Roles: separate `user_roles` table + `has_role()` security-definer (mandatory pattern).
- Server functions for all DB reads/writes via `createServerFn` + `requireSupabaseAuth`.
- Stripe webhook signature verified with `STRIPE_WEBHOOK_SECRET`.
- Public assets only — no service-role keys reach the browser.

## Out of scope (will note for follow-up)
- Native push from `/team` to the Android kiosk (FCM) — separate task.
- Email invites to non-registered users (would need Resend connector).

Approve and I'll start with step 1 (enabling Cloud) and proceed straight through.
