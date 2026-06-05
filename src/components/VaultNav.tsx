import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";

export function VaultNav() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: "Home", auth: false },
    { to: "/about", label: "About", auth: false },
    { to: "/videos", label: "Videos", auth: false },
    { to: "/blog", label: "Blog", auth: false },
    { to: "/partner", label: "Partner", auth: false },
    { to: "/waitlist", label: "Waitlist", auth: false },
    { to: "/huddle", label: "App", auth: true },
    { to: "/friends", label: "Friends", auth: true },
    { to: "/settings", label: "Settings", auth: true },
  ] as const;

  const visible = links.filter((l) => !l.auth || !!user);

  return (
    <nav className="relative z-10 brutal-border border-x-0 border-t-0 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src={logo} alt="The Focus Vault" className="h-9 w-9" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold tracking-tight">THE FOCUS VAULT</span>
            <span className="label">deep work · kiosk grade</span>
          </div>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {visible.map((l) => (
            <Link key={l.to} to={l.to} className="label hover:text-foreground">{l.label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <button
              onClick={signOut}
              className="hidden md:inline-flex brutal-border px-3 py-2 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-flex brutal-border bg-foreground px-4 py-2 mono text-xs font-bold uppercase tracking-wider text-background hover:opacity-90"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden brutal-border p-2 hover:bg-secondary"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden brutal-border border-x-0 border-b-0 bg-background">
          <div className="mx-auto flex max-w-7xl flex-col px-6 py-4 gap-3">
            {visible.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="label py-2 hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="mono text-[10px] text-muted-foreground pt-2 border-t border-border">{user.email}</div>
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="brutal-border px-3 py-2 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary text-left"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="brutal-border bg-foreground px-4 py-2 mono text-xs font-bold uppercase tracking-wider text-background text-center"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
