"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Mission } from "@/lib/types";
import { parseMission } from "@/lib/mission-validation";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function browserClient() {
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

function toRow(mission: Mission) {
  return {
    id: mission.id,
    owner_id: mission.ownerId,
    area_label: mission.areaLabel,
    latitude: mission.latitude,
    longitude: mission.longitude,
    h3_cell: mission.h3Cell,
    polygon: mission.polygon,
    target_taxon: mission.targetTaxon,
    analysis_snapshot: mission.analysisSnapshot,
    scheduled_date: mission.scheduledDate,
    duration_minutes: mission.durationMinutes,
    status: mission.status,
    evidence_url: mission.evidenceUrl ?? null,
    is_public: mission.isPublic,
    created_at: mission.createdAt,
    completed_at: mission.completedAt ?? null,
  };
}

function fromRow(row: Record<string, unknown>, expectedId?: string): Mission | null {
  return parseMission({
    id: String(row.id),
    ownerId: row.owner_id ? String(row.owner_id) : undefined,
    areaLabel: String(row.area_label),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    h3Cell: String(row.h3_cell),
    polygon: row.polygon as [number, number][],
    targetTaxon: row.target_taxon as Mission["targetTaxon"],
    analysisSnapshot: row.analysis_snapshot as Mission["analysisSnapshot"],
    scheduledDate: String(row.scheduled_date),
    durationMinutes: Number(row.duration_minutes),
    status: row.status as Mission["status"],
    evidenceUrl: row.evidence_url ? String(row.evidence_url) : undefined,
    isPublic: Boolean(row.is_public),
    createdAt: String(row.created_at),
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
  }, expectedId);
}

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

export async function persistMission(mission: Mission, captchaToken?: string) {
  storeMissionLocally(mission);
  const supabase = browserClient();
  if (!supabase) return { storage: "portable" as const, mission };

  let { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    const result = await supabase.auth.signInAnonymously({
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (result.error || !result.data.user) return { storage: "portable" as const, mission };
    sessionData = { session: result.data.session };
  }
  const userId = sessionData.session?.user.id;
  if (!userId) return { storage: "portable" as const, mission };
  const ownedMission = { ...mission, ownerId: userId };
  const { error } = await supabase.from("missions").upsert(toRow(ownedMission));
  if (error) return { storage: "portable" as const, mission };
  storeMissionLocally(ownedMission);
  return { storage: "supabase" as const, mission: ownedMission };
}

export async function fetchPublicMission(id: string) {
  const supabase = browserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("missions").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return fromRow(data as Record<string, unknown>, id);
}

export async function completeStoredMission(mission: Mission) {
  storeMissionLocally(mission);
  const supabase = browserClient();
  if (!supabase || !mission.ownerId) return;
  await supabase.from("missions").update({
    status: mission.status,
    evidence_url: mission.evidenceUrl ?? null,
    completed_at: mission.completedAt ?? null,
  }).eq("id", mission.id);
}
