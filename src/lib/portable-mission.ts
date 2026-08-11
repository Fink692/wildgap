import type { Mission } from "@/lib/types";
import { parseMission } from "@/lib/mission-validation";

export const MAX_PORTABLE_MISSION_LENGTH = 16_000;

export function encodeMission(mission: Mission) {
  const bytes = new TextEncoder().encode(JSON.stringify(mission));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function decodeMission(value: string, expectedId?: string): Mission | null {
  if (!value || value.length > MAX_PORTABLE_MISSION_LENGTH || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return parseMission(JSON.parse(new TextDecoder().decode(bytes)), expectedId);
  } catch {
    return null;
  }
}
