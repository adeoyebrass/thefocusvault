import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

interface Props {
  /** end time in 24h "HH:MM", default 17:00 */
  endTime?: string;
  /** start time, default 09:00 */
  startTime?: string;
  className?: string;
}

export function Countdown({ endTime = "17:00", startTime = "09:00", className = "" }: Props) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [eh, em] = endTime.split(":").map(Number);
  const [sh, sm] = startTime.split(":").map(Number);
  const end = new Date(now);
  end.setHours(eh, em, 0, 0);
  const start = new Date(now);
  start.setHours(sh, sm, 0, 0);

  const totalMs = Math.max(end.getTime() - start.getTime(), 1);
  const remainMs = Math.max(end.getTime() - now.getTime(), 0);
  const pct = 1 - remainMs / totalMs;

  const totalSec = Math.floor(remainMs / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;

  const isCritical = remainMs > 0 && remainMs < 30 * 60 * 1000;

  return (
    <div className={className}>
      <div className="label mb-3">REMAINING IN VAULT</div>
      <div
        className={`mono text-6xl font-bold tabular-nums leading-none md:text-8xl ${
          isCritical ? "stakes-amber pulse-stakes" : ""
        }`}
      >
        {pad(hrs)}<span className="text-muted-foreground">:</span>
        {pad(min)}<span className="text-muted-foreground">:</span>
        {pad(sec)}
      </div>
      <div className="mt-6 h-1.5 w-full bg-secondary">
        <div
          className={`h-full ${isCritical ? "bg-stakes-amber" : "bg-foreground"}`}
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between mono text-xs text-muted-foreground">
        <span>{startTime} START</span>
        <span>{Math.round(pct * 100)}% COMPLETE</span>
        <span>{endTime} RELEASE</span>
      </div>
    </div>
  );
}
