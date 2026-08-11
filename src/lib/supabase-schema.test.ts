import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function migration(name: string) {
  return readFileSync(join(process.cwd(), "supabase", "migrations", name), "utf8");
}

describe("Supabase mission security contract", () => {
  it("enables RLS and binds every write policy to auth.uid()", () => {
    const sql = migration("202608100001_create_missions.sql");
    expect(sql).toContain("alter table public.missions enable row level security");
    expect(sql).toContain("with check (owner_id = (select auth.uid()))");
    expect(sql).toContain("using (owner_id = (select auth.uid()))");
  });

  it("grants anonymous visitors read-only access and authenticated users bounded CRUD", () => {
    const sql = migration("202608100003_tighten_mission_grants.sql");
    expect(sql).toContain("revoke all privileges on table public.missions from anon, authenticated");
    expect(sql).toContain("grant select on table public.missions to anon");
    expect(sql).toContain("grant select, insert, update, delete on table public.missions to authenticated");
    expect(sql).not.toMatch(/grant\s+(insert|update|delete).*\s+to\s+anon/i);
  });
});
