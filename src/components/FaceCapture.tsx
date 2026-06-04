import { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (blob: Blob) => void;
};

export function FaceCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Camera unavailable");
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function snap() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const size = 480;
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    // center-crop
    const sx = (v.videoWidth - Math.min(v.videoWidth, v.videoHeight)) / 2;
    const sy = (v.videoHeight - Math.min(v.videoWidth, v.videoHeight)) / 2;
    const sw = Math.min(v.videoWidth, v.videoHeight);
    ctx.drawImage(v, sx, sy, sw, sw, 0, 0, size, size);
    c.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, "image/jpeg", 0.85);
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full max-w-sm brutal-border overflow-hidden bg-secondary">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      {err && <div className="stakes-crimson mono text-xs">{err}</div>}
      <button
        type="button"
        disabled={!ready}
        onClick={snap}
        className="w-full brutal-border bg-foreground py-3 mono text-xs font-bold uppercase tracking-widest text-background hover:opacity-90 disabled:opacity-50"
      >
        {ready ? "Capture selfie" : "Starting camera…"}
      </button>
    </div>
  );
}
