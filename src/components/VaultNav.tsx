import { Link } from "@tanstack/react-router";

export function VaultNav() {
  return (
    <nav className="relative z-10 brutal-border border-x-0 border-t-0 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center bg-foreground text-background mono font-bold">
            FV
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold tracking-tight">THE FOCUS VAULT</span>
            <span className="label">v0 · kiosk grade</span>
          </div>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link to="/huddle" className="label hover:text-foreground">Huddle</Link>
          <Link to="/lock" className="label hover:text-foreground">Lock Demo</Link>
          <Link to="/break-glass" className="label hover:text-foreground">Break Glass</Link>
          <Link to="/vouch/demo-vote-001" className="label hover:text-foreground">Voucher Portal</Link>
        </div>
        <Link
          to="/huddle"
          className="brutal-border bg-foreground px-4 py-2 mono text-xs font-bold uppercase tracking-wider text-background hover:opacity-90"
        >
          Enter · $10/mo
        </Link>
      </div>
    </nav>
  );
}
