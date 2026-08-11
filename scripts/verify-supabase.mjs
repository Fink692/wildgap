import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before running this check.");
}

function client() {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const owner = client();
const stranger = client();
const missionId = randomUUID();
let ownerId;

try {
  const ownerAuth = await owner.auth.signInAnonymously();
  if (ownerAuth.error) throw new Error(`Owner anonymous sign-in failed: ${ownerAuth.error.message}`);
  ownerId = ownerAuth.data.user?.id;
  assert(ownerId, "Owner anonymous sign-in returned no user ID.");

  const strangerAuth = await stranger.auth.signInAnonymously();
  if (strangerAuth.error) throw new Error(`Stranger anonymous sign-in failed: ${strangerAuth.error.message}`);
  assert(strangerAuth.data.user?.id && strangerAuth.data.user.id !== ownerId, "The isolation check requires two distinct anonymous users.");

  const createdAt = new Date().toISOString();
  const row = {
    id: missionId,
    owner_id: ownerId,
    area_label: "WildGap RLS verification",
    latitude: 49.8844,
    longitude: -97.14704,
    h3_cell: "8726cc4d9ffffff",
    polygon: [[-97.2, 49.8], [-97.1, 49.8], [-97.1, 49.9], [-97.2, 49.8]],
    target_taxon: "Insects",
    analysis_snapshot: {
      gapScore: 82,
      confidence: "High",
      explanation: "Automated RLS verification row.",
      dataStatus: "demo-snapshot",
      generatedAt: createdAt,
    },
    scheduled_date: "2026-08-12",
    duration_minutes: 60,
    status: "planned",
    is_public: false,
    created_at: createdAt,
  };

  const insert = await owner.from("missions").insert(row).select("id,status").single();
  if (insert.error) throw new Error(`Owner insert failed: ${insert.error.message}`);
  assert(insert.data?.id === missionId && insert.data.status === "planned", "Owner insert did not return the expected mission.");

  const strangerRead = await stranger.from("missions").select("id").eq("id", missionId).maybeSingle();
  if (strangerRead.error) throw new Error(`Stranger private read check failed: ${strangerRead.error.message}`);
  assert(strangerRead.data === null, "A stranger could read a private mission.");

  const strangerUpdate = await stranger.from("missions").update({ status: "completed" }).eq("id", missionId).select("id");
  if (strangerUpdate.error) throw new Error(`Stranger update check failed: ${strangerUpdate.error.message}`);
  assert(strangerUpdate.data?.length === 0, "A stranger could update another user's mission.");

  const completedAt = new Date().toISOString();
  const ownerUpdate = await owner
    .from("missions")
    .update({ status: "completed", evidence_url: "https://example.com/wildgap-smoke", completed_at: completedAt })
    .eq("id", missionId)
    .select("status,evidence_url,completed_at")
    .single();
  if (ownerUpdate.error) throw new Error(`Owner update failed: ${ownerUpdate.error.message}`);
  assert(ownerUpdate.data?.status === "completed" && ownerUpdate.data.evidence_url === "https://example.com/wildgap-smoke", "Owner update did not persist.");

  const cleanup = await owner.from("missions").delete().eq("id", missionId);
  if (cleanup.error) throw new Error(`Mission cleanup failed: ${cleanup.error.message}`);

  console.log("Supabase verification passed: anonymous auth, owner insert/update/delete, private isolation, and stranger-write denial.");
} finally {
  if (ownerId) await owner.from("missions").delete().eq("id", missionId);
  await Promise.allSettled([owner.auth.signOut(), stranger.auth.signOut()]);
}
