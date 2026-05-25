import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "vault.install.dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    setIsIOS(ios);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS doesn't fire beforeinstallprompt — show manual instructions after a beat
    const t = ios ? setTimeout(() => setOpen(true), 1200) : null;

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      if (t) clearTimeout(t);
    };
  }, []);

  if (installed || !open) return null;

  const accept = async () => {
    if (evt) {
      await evt.prompt();
      await evt.userChoice;
    }
    setOpen(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[60] md:left-auto md:right-6 md:bottom-6 md:w-[420px]">
      <div className="brutal-border bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="label stakes-amber">⚠ INSTALL TO DEVICE</div>
            <h3 className="mt-1 font-display text-lg font-bold leading-tight">
              The Vault works best installed.
            </h3>
          </div>
          <button
            onClick={dismiss}
            aria-label="dismiss"
            className="mono text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Add Focus Vault to your home screen so the lock screen opens full-screen with no
          browser chrome. On install you'll be asked to grant{" "}
          <span className="stakes-amber">notifications</span>,{" "}
          <span className="stakes-amber">screen wake-lock</span>, and{" "}
          <span className="stakes-amber">storage</span>. Accept all to arm the vault.
        </p>

        {isIOS ? (
          <ol className="mt-4 space-y-1 mono text-[11px] text-foreground">
            <li>1. Tap the <strong>Share</strong> icon in Safari.</li>
            <li>2. Choose <strong>Add to Home Screen</strong>.</li>
            <li>3. Open Focus Vault from the home screen icon.</li>
          </ol>
        ) : (
          <button
            onClick={accept}
            disabled={!evt}
            className="mt-4 w-full brutal-border bg-foreground py-3 mono text-xs font-bold uppercase tracking-widest text-background disabled:opacity-50"
          >
            {evt ? "INSTALL → ACCEPT ALL PROMPTS" : "OPEN BROWSER MENU → INSTALL APP"}
          </button>
        )}

        <p className="mt-3 mono text-[10px] text-muted-foreground">
          Full OS-level lock (kill-switch resistance) requires the native build — install here
          first; we'll deep-link you to the Play / App Store binary on launch day.
        </p>
      </div>
    </div>
  );
}
