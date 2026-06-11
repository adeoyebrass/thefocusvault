Big batch. I'll ship it in one pass, no real Stripe yet — fines log to DB and the existing $20 break-glass UI stays the same shape.

## 1. Pricing & copy (Universal $20 Break-Glass, 4 tiers)

`src/routes/index.tsx` — replace `PLANS` and `REVENUE_LINES`:
- **Single Pass** — $50/yr, 1 seat, $20 fine to user card.
- **Family Vault** — $220/yr, up to 6 seats, $20 fine billed to parent admin card on approved release.
- **Corporate Sprint** — $350/yr, up to 10 seats, $20 fine billed to corporate / logged to seat registry.
- **Hardcore Solo** — $10/mo, 1 seat, $20 fine + mandatory 10-Voucher verification.
- Drop all 70%-of-plan stake copy. Universal $20 everywhere.
- Update hero CTA + final CTA to "Lock in · from $10/mo".

`src/routes/api/chat.ts` — rewrite Plan Advisor prompt for the 4 plans + universal $20 fine; add Hardcore Solo as the monthly hyper-accountability option; remove stake math.

## 2. Family Extra Hours Rooms (DB + admin UI)

Migration adds:
- `room_type` enum (`extension`, `ephemeral`)
- `focus_rooms` table: `id`, `owner_id` (parent admin), `title`, `type`, `starts_at`, `ends_at`, `is_active`, timestamps
- `focus_room_participants` table: `room_id`, `user_id`, unique pair
- RLS: parents (any authenticated user, scoped by `owner_id = auth.uid()`) manage their own rooms + participants; participants can SELECT rooms they're in. Service role full access.
- GRANTs to authenticated + service_role.

UI: new route `src/routes/rooms.tsx` (under public root, gated by auth state already used on `/friends`-style routes) — parent creates rooms, lists active ones, adds participants by email lookup against `profiles`. Server fns in `src/lib/rooms.functions.ts` with `requireSupabaseAuth`.

## 3. Admin Telemetry Grid (live)

`src/routes/admin.tsx` already exists — extend it (or add `src/routes/telemetry.tsx` if cleaner) with a realtime grid:
- Columns: User, Device Status (🔒/🔓/📵), Active Room, Violation Flags, Remote Action.
- Data source: join `profiles` + latest `lock_events` + active `focus_rooms` participation + `focus_sessions` violation count.
- Realtime via `supabase.channel` on `lock_events` + `focus_rooms` (enable both in `supabase_realtime` publication).
- Buttons (Force Lock / Force Unlock / Ping) call existing server fns; if missing, stub to insert a `lock_events` row with the new state.
- Offline rule: if last `lock_events` heartbeat > 60s ago, render `OFFLINE — POSSIBLE EVASION` in amber.

Restrict view to `has_role(auth.uid(), 'admin')` server-side.

## 4. Security fixes

**Face verification bypass** — `src/lib/profile.functions.ts` `markFaceVerified`: assert `data.path.startsWith(\`${userId}/\`)`; then `supabaseAdmin.storage.from('face-verifications').list(userId)` and verify the exact object exists; throw 403 otherwise.

**friend_pings recipient overwrite** — migration drops the existing `recipient marks read` UPDATE policy and replaces it with a policy + `BEFORE UPDATE` trigger that raises unless only `read_at` changed (and `read_at` goes from NULL → non-NULL).

## 5. Out of scope this turn

- Real Stripe capture / PaymentIntent routing — UI logs the $20 fine to a new `penalty_records` table only if we have time; otherwise reuse existing `lock_events`. I'll add `penalty_records` (amount_cents default 2000, status, justification, stripe_charge_id nullable) so the schema is ready for Stripe later.
- Vouch self-approval and friendships column-restriction findings (separate finding, not requested).
- Mobile/Android kiosk wiring for the new rooms — JS scheduler only.

## Technical notes

- All new tables: GRANT to authenticated + service_role, RLS on, policies scoped to `auth.uid()` or `has_role`.
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.focus_rooms, public.lock_events;` (lock_events if not already).
- No Stripe SDK added.
- No changes to `src/integrations/supabase/*` auto-gen files.

Ready to build?