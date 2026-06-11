import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { VaultNav } from "@/components/VaultNav";
import {
  addParticipant,
  closeRoom,
  createRoom,
  listMyRooms,
  removeParticipant,
} from "@/lib/rooms.functions";

export const Route = createFileRoute("/rooms")({
  component: RoomsPage,
  head: () => ({
    meta: [
      { title: "Extra Hours Rooms · The Focus Vault" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function isoLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function RoomsPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  const list = useServerFn(listMyRooms);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-rooms"],
    queryFn: () => list(),
    enabled: !!user,
  });

  const create = useServerFn(createRoom);
  const add = useServerFn(addParticipant);
  const remove = useServerFn(removeParticipant);
  const close = useServerFn(closeRoom);

  const createMut = useMutation({
    mutationFn: create,
    onSuccess: () => {
      toast.success("Room provisioned.");
      qc.invalidateQueries({ queryKey: ["my-rooms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const addMut = useMutation({
    mutationFn: add,
    onSuccess: () => {
      toast.success("Participant injected.");
      qc.invalidateQueries({ queryKey: ["my-rooms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const removeMut = useMutation({
    mutationFn: remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-rooms"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const closeMut = useMutation({
    mutationFn: close,
    onSuccess: () => {
      toast.success("Room torn down.");
      qc.invalidateQueries({ queryKey: ["my-rooms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const now = new Date();
  const defaultStart = isoLocal(now);
  const defaultEnd = isoLocal(new Date(now.getTime() + 60 * 60 * 1000));

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"extension" | "ephemeral">("ephemeral");
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);

  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="label mb-3">§ FAMILY · EXTRA HOURS PROTOCOL</div>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Provision a focus room.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Spin up a time-bound lockdown for a child or family member. Choose <strong>extension</strong> to extend an
          existing weekday block, or <strong>ephemeral</strong> for a brand-new window (weekend study, exam prep). The
          $20 break-glass fine activates the moment a participant is injected.
        </p>

        {/* Create */}
        <form
          className="brutal-card mt-8 grid gap-4 p-6 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            createMut.mutate({
              data: {
                title: title.trim(),
                type,
                starts_at: new Date(startsAt).toISOString(),
                ends_at: new Date(endsAt).toISOString(),
              },
            });
            setTitle("");
          }}
        >
          <div className="md:col-span-2">
            <div className="label mb-2">Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Math Finals Prep"
              className="brutal-border w-full bg-background px-3 py-2 text-sm"
              maxLength={120}
              required
            />
          </div>
          <div>
            <div className="label mb-2">Type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "extension" | "ephemeral")}
              className="brutal-border w-full bg-background px-3 py-2 text-sm"
            >
              <option value="ephemeral">Ephemeral (new block)</option>
              <option value="extension">Extension (extend existing)</option>
            </select>
          </div>
          <div />
          <div>
            <div className="label mb-2">Starts</div>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="brutal-border w-full bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <div className="label mb-2">Ends</div>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="brutal-border w-full bg-background px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMut.isPending}
              className="brutal-border bg-foreground px-5 py-3 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90 disabled:opacity-50"
            >
              {createMut.isPending ? "Provisioning…" : "Provision room →"}
            </button>
          </div>
        </form>

        {/* List */}
        <div className="mt-10">
          <div className="label mb-3">YOUR ROOMS</div>
          {isLoading && <div className="mono text-xs text-muted-foreground">Loading…</div>}
          {!isLoading && (data?.length ?? 0) === 0 && (
            <div className="brutal-card p-6 mono text-xs text-muted-foreground">No rooms yet.</div>
          )}
          <div className="grid gap-4">
            {(data ?? []).map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onAdd={(email) => addMut.mutate({ data: { room_id: room.id, email } })}
                onRemove={(uid) => removeMut.mutate({ data: { room_id: room.id, user_id: uid } })}
                onClose={() => closeMut.mutate({ data: { id: room.id } })}
                addPending={addMut.isPending}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type RoomData = Awaited<ReturnType<typeof listMyRooms>>[number];

function RoomCard({
  room,
  onAdd,
  onRemove,
  onClose,
  addPending,
}: {
  room: RoomData;
  onAdd: (email: string) => void;
  onRemove: (uid: string) => void;
  onClose: () => void;
  addPending: boolean;
}) {
  const [email, setEmail] = useState("");
  const active = room.is_active && new Date(room.ends_at) > new Date();
  return (
    <div className={`brutal-card p-5 ${active ? "ring-amber" : "opacity-70"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="label">{room.type === "extension" ? "EXTENSION" : "EPHEMERAL"} · {active ? "ACTIVE" : "CLOSED"}</div>
          <div className="font-display text-xl font-bold mt-1">{room.title}</div>
          <div className="mono text-[11px] text-muted-foreground mt-1">
            {new Date(room.starts_at).toLocaleString()} → {new Date(room.ends_at).toLocaleString()}
          </div>
        </div>
        {active && (
          <button
            onClick={onClose}
            className="brutal-border px-3 py-1.5 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary"
          >
            Tear down
          </button>
        )}
      </div>

      <div className="mt-4">
        <div className="label mb-2">PARTICIPANTS · {room.participants.length}</div>
        <ul className="divide-y divide-border">
          {room.participants.map((p) => (
            <li key={p.user_id} className="flex items-center justify-between py-2">
              <span className="text-sm">{p.profile?.display_name ?? p.profile?.email ?? p.user_id.slice(0, 8)}</span>
              <button
                onClick={() => onRemove(p.user_id)}
                className="mono text-[10px] uppercase text-muted-foreground hover:stakes-crimson"
              >
                Remove
              </button>
            </li>
          ))}
          {room.participants.length === 0 && (
            <li className="py-2 mono text-[10px] text-muted-foreground">No participants injected yet.</li>
          )}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            onAdd(email.trim());
            setEmail("");
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="participant@email.com"
            className="brutal-border flex-1 bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={addPending}
            className="brutal-border bg-foreground px-3 py-2 mono text-[10px] font-bold uppercase tracking-widest text-background hover:opacity-90 disabled:opacity-50"
          >
            Inject
          </button>
        </form>
      </div>
    </div>
  );
}
