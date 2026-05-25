import { useEffect, useState } from "react";

export type Member = { id: string; name: string; email: string; role: "lead" | "member" };

export type VaultConfig = {
  startTime: string; // "HH:MM"
  endTime: string;
  teamId: string | null;
  isLead: boolean;
  members: Member[];
};

const KEY = "vault.config.v1";
export const FREE_SEATS = 5;
export const PER_EXTRA_SEAT_USD = 2;

const DEFAULT: VaultConfig = {
  startTime: "09:00",
  endTime: "17:00",
  teamId: null,
  isLead: true,
  members: [],
};

function read(): VaultConfig {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

function write(cfg: VaultConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent("vault:config", { detail: cfg }));
}

export function useVaultConfig() {
  const [cfg, setCfg] = useState<VaultConfig>(DEFAULT);
  useEffect(() => {
    setCfg(read());
    const on = (e: Event) => setCfg((e as CustomEvent<VaultConfig>).detail);
    window.addEventListener("vault:config", on);
    return () => window.removeEventListener("vault:config", on);
  }, []);
  const update = (patch: Partial<VaultConfig>) => write({ ...read(), ...patch });
  return [cfg, update] as const;
}

export function billableExtras(memberCount: number) {
  return Math.max(0, memberCount - FREE_SEATS);
}

export function monthlyExtrasUsd(memberCount: number) {
  return billableExtras(memberCount) * PER_EXTRA_SEAT_USD;
}

/** Returns hours between startTime and endTime, 0 if invalid */
export function focusHours(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return Math.max(0, mins / 60);
}
