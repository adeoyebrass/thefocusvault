import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="font-display text-lg font-bold">THE FOCUS VAULT</div>
          <p className="mt-3 text-sm text-muted-foreground">
            A kiosk-grade lockdown for deep work. The app you cannot talk your way out of.
          </p>
        </div>
        <div>
          <div className="label mb-3">Product</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:underline">About the app</Link></li>
            <li><Link to="/login" className="hover:underline">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <div className="label mb-3">Learn</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/videos" className="hover:underline">Videos</Link></li>
            <li><Link to="/blog" className="hover:underline">Blog</Link></li>
          </ul>
        </div>
        <div>
          <div className="label mb-3">Work with us</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/partner" className="hover:underline">Become a partner</Link></li>
            <li><Link to="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-border px-6 py-6 mono text-xs text-muted-foreground md:flex-row">
        <span>© THE FOCUS VAULT · KIOSK GRADE</span>
        <div className="flex items-center gap-5">
          <a href="https://facebook.com/focusvault" target="_blank" rel="noopener noreferrer" className="hover:text-foreground uppercase tracking-widest">Facebook</a>
          <a href="https://youtube.com/@focusvault" target="_blank" rel="noopener noreferrer" className="hover:text-foreground uppercase tracking-widest">YouTube</a>
          <a href="https://twitter.com/focusvault" target="_blank" rel="noopener noreferrer" className="hover:text-foreground uppercase tracking-widest">Twitter</a>
        </div>
      </div>
    </footer>
  );
}
