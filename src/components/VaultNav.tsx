import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";

export function VaultNav() {
  const { user, signOut } = useAuth();
  return (
    <nav className="relative z-10 brutal-border border-x-0 border-t-0 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="The Focus Vault" className="h-9 w-9" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold tracking-tight">THE FOCUS VAULT</span>
            <span className="label">deep work · kiosk grade</span>
          </div>
        </Link>
        <div className="hidden items-center gap-6 lg:flex">
          <Link to="/" className="label hover:text-foreground">Home</Link>
          <Link to="/about" className="label hover:text-foreground">About</Link>
          <Link to="/videos" className="label hover:text-foreground">Videos</Link>
          <Link to="/blog" className="label hover:text-foreground">Blog</Link>
          <Link to="/partner" className="label hover:text-foreground">Partner</Link>
          <Link to="/waitlist" className="label hover:text-foreground">Waitlist</Link>
          {user && <Link to="/huddle" className="label hover:text-foreground">App</Link>}
          {user && <Link to="/friends" className="label hover:text-foreground">Friends</Link>}
          {user && <Link to="/settings" className="label hover:text-foreground">Settings</Link>}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <span className="hidden md:inline mono text-[10px] text-muted-foreground">{user.email}</span>
              <button
                onClick={signOut}
                className="brutal-border px-3 py-2 mono text-[10px] font-bold uppercase tracking-widest hover:bg-secondary"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="brutal-border bg-foreground px-4 py-2 mono text-xs font-bold uppercase tracking-wider text-background hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
