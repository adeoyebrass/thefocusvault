import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import {
  listMyFriends,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  pingFriend,
  listMyPings,
  markPingRead,
} from "@/lib/friends.functions";

export const Route = createFileRoute("/friends")({
  component: FriendsPage,
  head: () => ({
    meta: [
      { title: "Friends · Focus Vault" },
      { name: "description", content: "Add focus partners, ping them to lock, request a break-glass vouch." },
    ],
  }),
});

function FriendsPage() {
  const { user, verified, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && (!user || !verified)) nav({ to: "/login", replace: true });
  }, [user, verified, loading, nav]);

  const list = useServerFn(listMyFriends);
  const send = useServerFn(sendFriendRequest);
  const respond = useServerFn(respondFriendRequest);
  const remove = useServerFn(removeFriend);
  const ping = useServerFn(pingFriend);
  const pings = useServerFn(listMyPings);
  const markRead = useServerFn(markPingRead);

  const { data: friends = [] } = useQuery({ queryKey: ["friends"], queryFn: () => list(), enabled: !!user });
  const { data: inbox = [] } = useQuery({ queryKey: ["friend-pings"], queryFn: () => pings(), enabled: !!user, refetchInterval: 20_000 });

  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await send({ data: { email: email.trim().toLowerCase() } });
      setEmail("");
      qc.invalidateQueries({ queryKey: ["friends"] });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  async function onRespond(id: string, accept: boolean) {
    await respond({ data: { id, accept } });
    qc.invalidateQueries({ queryKey: ["friends"] });
  }

  async function onRemove(id: string) {
    await remove({ data: { id } });
    qc.invalidateQueries({ queryKey: ["friends"] });
  }

  async function onPing(recipient_id: string, kind: "lock" | "break_request") {
    const msg = kind === "lock"
      ? "Time to lock your phone — let's focus."
      : "I'm requesting a break-glass — can you vouch?";
    await ping({ data: { recipient_id, kind, message: msg } });
  }

  async function onMarkRead(id: string) {
    await markRead({ data: { id } });
    qc.invalidateQueries({ queryKey: ["friend-pings"] });
  }

  const accepted = friends.filter((f) => f.status === "accepted");
  const incoming = friends.filter((f) => f.status === "pending" && f.direction === "incoming");
  const outgoing = friends.filter((f) => f.status === "pending" && f.direction === "outgoing");
  const unread = inbox.filter((p) => !p.read_at);

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="label mb-3">§ 04 · FRIENDS</div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Your focus circle.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Add registered Vault users by email. Once they accept, you can ping each other to lock down
          or call for a break-glass vote when a real emergency hits.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5 space-y-6">
            <form onSubmit={onAdd} className="brutal-card p-6">
              <div className="label mb-3">SEND FRIEND REQUEST</div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@registered.com"
                  className="brutal-border bg-background px-3 py-2 text-sm outline-none"
                />
                <button className="brutal-border bg-foreground px-5 py-2 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90">
                  + REQUEST
                </button>
              </div>
              {err && <div className="mt-2 stakes-crimson mono text-xs">{err}</div>}
            </form>

            {incoming.length > 0 && (
              <div className="brutal-card overflow-hidden ring-amber">
                <div className="border-b border-border px-5 py-3 label">INCOMING REQUESTS · {incoming.length}</div>
                <ul className="divide-y divide-border">
                  {incoming.map((f) => (
                    <li key={f.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="font-display text-sm font-bold">{f.other.display_name ?? f.other.email}</div>
                        <div className="mono text-[10px] text-muted-foreground">{f.other.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => onRespond(f.id, true)} className="brutal-border bg-foreground px-3 py-1.5 mono text-[10px] font-bold uppercase tracking-widest text-background">Accept</button>
                        <button onClick={() => onRespond(f.id, false)} className="brutal-border px-3 py-1.5 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary">Decline</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {outgoing.length > 0 && (
              <div className="brutal-card overflow-hidden">
                <div className="border-b border-border px-5 py-3 label">SENT · AWAITING REPLY</div>
                <ul className="divide-y divide-border">
                  {outgoing.map((f) => (
                    <li key={f.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="font-display text-sm font-bold">{f.other.display_name ?? f.other.email}</div>
                        <div className="mono text-[10px] text-muted-foreground">{f.other.email}</div>
                      </div>
                      <button onClick={() => onRemove(f.id)} className="mono text-[10px] text-muted-foreground hover:stakes-crimson">CANCEL</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="brutal-card overflow-hidden">
              <div className="border-b border-border px-5 py-3 label">
                YOUR INBOX {unread.length > 0 && <span className="stakes-amber">· {unread.length} NEW</span>}
              </div>
              {inbox.length === 0 ? (
                <div className="px-5 py-6 mono text-xs text-muted-foreground">No pings yet.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {inbox.slice(0, 8).map((p) => (
                    <li key={p.id} className={`px-5 py-3 ${!p.read_at ? "bg-secondary/30" : ""}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-display text-sm font-bold">
                            {p.sender?.display_name ?? p.sender?.email ?? "Unknown"}{" "}
                            <span className={`ml-2 mono text-[10px] ${p.kind === "break_request" ? "stakes-crimson" : "stakes-amber"}`}>
                              {p.kind === "break_request" ? "BREAK-GLASS" : "LOCK NOW"}
                            </span>
                          </div>
                          {p.message && <div className="mt-0.5 mono text-xs text-muted-foreground">{p.message}</div>}
                        </div>
                        {!p.read_at && (
                          <button onClick={() => onMarkRead(p.id)} className="mono text-[10px] text-muted-foreground hover:text-foreground">MARK READ</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="brutal-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="label">YOUR FRIENDS · {accepted.length}</div>
              </div>
              {accepted.length === 0 ? (
                <div className="px-5 py-10 mono text-xs text-muted-foreground">
                  No friends yet. Send a request to get started.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {accepted.map((f) => (
                    <li key={f.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <div className="font-display text-sm font-bold">{f.other.display_name ?? f.other.email}</div>
                        <div className="mono text-[10px] text-muted-foreground">{f.other.email}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => onPing(f.other.user_id, "lock")}
                          className="brutal-border bg-stakes-amber px-3 py-1.5 mono text-[10px] font-bold uppercase tracking-widest"
                          title="Ping them to lock"
                        >
                          Ping · Lock
                        </button>
                        <button
                          onClick={() => onPing(f.other.user_id, "break_request")}
                          className="brutal-border px-3 py-1.5 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary"
                          title="Ask for a break-glass vouch"
                        >
                          Request break
                        </button>
                        <button onClick={() => onRemove(f.id)} className="mono text-[10px] text-muted-foreground hover:stakes-crimson">REMOVE</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
