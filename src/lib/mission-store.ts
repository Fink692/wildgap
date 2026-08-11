"use client";

import type { Mission } from "@/lib/types";
import { parseMission } from "@/lib/mission-validation";

export function localMission(id: string) {
  try {
    const value = localStorage.getItem(`wildgap:mission:${id}`);
    return value ? parseMission(JSON.parse(value), id) : null;
  } catch {
    return null;
  }
}

export function storeMissionLocally(mission: Mission) {
  try {
    localStorage.setItem(`wildgap:mission:${mission.id}`, JSON.stringify(mission));
    return true;
  } catch {
    return false;
  }
}

export function persistMission(mission: Mission) {
  if (!storeMissionLocally(mission)) {
    throw new Error("Mission storage is unavailable on this device.");
  }
  return mission;
}

export function completeStoredMission(mission: Mission) {
  if (!storeMissionLocally(mission)) {
    throw new Error("Mission storage is unavailable on this device.");
  }
}
