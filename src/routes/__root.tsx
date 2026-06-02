import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#000000" },
      { title: "The Focus Vault — Hard lockdown for deep work" },
      { name: "description", content: "The Focus Vault is an absolute environmental isolation tool designed to eliminate digital distractions and defeat the \"myth of the quick peek.\"" },
      { property: "og:title", content: "The Focus Vault — Hard lockdown for deep work" },
      { property: "og:description", content: "The Focus Vault is an absolute environmental isolation tool designed to eliminate digital distractions and defeat the \"myth of the quick peek.\"" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The Focus Vault — Hard lockdown for deep work" },
      { name: "twitter:description", content: "The Focus Vault is an absolute environmental isolation tool designed to eliminate digital distractions and defeat the \"myth of the quick peek.\"" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/90718f07-a1ae-408c-93c7-2de03771d9b6" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/90718f07-a1ae-408c-93c7-2de03771d9b6" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthInvalidator() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}

const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/videos", "/blog", "/partner", "/contact", "/about", "/waitlist"]);

function AuthGate() {
  const { user, loading, verified } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublic = PUBLIC_PATHS.has(pathname);
  const canEnterApp = Boolean(user && verified);

  useEffect(() => {
    if (loading) return;
    if (!canEnterApp && !isPublic) {
      router.navigate({ to: "/login", replace: true });
    }
  }, [loading, canEnterApp, isPublic, router]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="label">§ AUTH · CHECKING</div>
      </div>
    );
  }

  if (!canEnterApp && !isPublic) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="label">§ REDIRECTING TO LOGIN</div>
      </div>
    );
  }

  return <Outlet />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthInvalidator />
        <AuthGate />
        <InstallPrompt />
      </AuthProvider>
    </QueryClientProvider>
  );
}
