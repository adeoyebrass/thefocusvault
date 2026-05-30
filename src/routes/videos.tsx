import { createFileRoute } from "@tanstack/react-router";
import { VaultNav } from "@/components/VaultNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/videos")({
  component: VideosPage,
  head: () => ({
    meta: [
      { title: "Videos — The Focus Vault" },
      { name: "description", content: "Short films on the global attention crisis, kiosk-grade focus, and the engineering behind The Focus Vault." },
      { property: "og:title", content: "Videos — The Focus Vault" },
      { property: "og:description", content: "Films on the global attention crisis and kiosk-grade focus." },
      { property: "og:url", content: "/videos" },
    ],
    links: [{ rel: "canonical", href: "/videos" }],
  }),
});

const VIDEOS = [
  {
    id: "dQw4w9WgXcQ",
    title: "The 47-second mind",
    desc: "Why the modern attention span collapsed — and what kernel-level enforcement looks like.",
    duration: "12:41",
  },
  {
    id: "ysz5S6PUM-U",
    title: "Field study: Lagos founders",
    desc: "Three Nigerian operators run a 30-day Focus Vault contract. We followed every break-glass event.",
    duration: "18:02",
  },
  {
    id: "aqz-KE-bpKQ",
    title: "Inside the break-glass vote",
    desc: "A real $20 override request, ten anonymous voters, and the architecture that decides.",
    duration: "9:24",
  },
  {
    id: "M7lc1UVf-VE",
    title: "Why your willpower lost",
    desc: "A 7-minute primer on attention residue and the maths behind environmental isolation.",
    duration: "7:11",
  },
];

function VideosPage() {
  return (
    <div className="relative min-h-screen">
      <VaultNav />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="label mb-3">§ FILMS & TALKS</div>
        <h1 className="font-display text-5xl font-bold tracking-tight md:text-6xl">
          Watch the global focus crisis unfold.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Short documentaries, field studies and product talks on what it costs the
          world when attention becomes a tradable resource — and what we do about it.
        </p>

        <div className="mt-16 grid gap-10 md:grid-cols-2">
          {VIDEOS.map((v) => (
            <article key={v.id} className="brutal-card overflow-hidden">
              <div className="relative aspect-video bg-secondary">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                  title={v.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <div className="label">{v.duration}</div>
                <h2 className="mt-2 font-display text-xl font-bold">{v.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
