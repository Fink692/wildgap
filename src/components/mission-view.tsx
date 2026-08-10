"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Binoculars,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  Link2,
  MapPin,
  Printer,
  ShieldAlert,
} from "lucide-react";
import { completeStoredMission, fetchPublicMission, localMission, storeMissionLocally } from "@/lib/mission-store";
import { decodeMission, encodeMission } from "@/lib/portable-mission";
import type { Mission } from "@/lib/types";

function humanDate(value: string) {
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function portableUrl(mission: Mission) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/missions/${mission.id}?data=${encodeMission(mission)}`;
}

export function MissionView({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<Mission | null>();
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [shareLabel, setShareLabel] = useState("Share");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const local = localMission(missionId);
      const encoded = new URL(window.location.href).searchParams.get("data");
      const portable = encoded ? decodeMission(encoded) : null;
      const remote = local || portable ? null : await fetchPublicMission(missionId);
      const loaded = local ?? portable ?? remote;
      if (loaded) storeMissionLocally(loaded);
      if (active) {
        setMission(loaded);
        setEvidenceUrl(loaded?.evidenceUrl ?? "");
      }
    }
    void load();
    return () => { active = false; };
  }, [missionId]);

  const coordinates = useMemo(
    () => mission ? `${mission.latitude.toFixed(4)}°, ${mission.longitude.toFixed(4)}°` : "",
    [mission],
  );

  async function shareMission() {
    if (!mission) return;
    const url = portableUrl(mission);
    if (navigator.share) {
      await navigator.share({ title: `WildGap: survey ${mission.targetTaxon.toLowerCase()}`, text: `Join this 60-minute biodiversity field mission in ${mission.areaLabel}.`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareLabel("Copied!");
      window.setTimeout(() => setShareLabel("Share"), 1800);
    }
  }

  async function completeMission(event: FormEvent) {
    event.preventDefault();
    if (!mission) return;
    if (evidenceUrl) {
      try { new URL(evidenceUrl); } catch { setError("Enter a complete evidence URL, including https://"); return; }
    }
    const completed: Mission = {
      ...mission,
      status: "completed",
      evidenceUrl: evidenceUrl || undefined,
      completedAt: new Date().toISOString(),
    };
    setMission(completed);
    setError("");
    await completeStoredMission(completed);
    window.history.replaceState(null, "", portableUrl(completed));
  }

  if (mission === undefined) return <main className="mission-loading"><span className="spinner" aria-label="Loading mission" /></main>;
  if (mission === null) {
    return (
      <main className="empty-state" id="main-content"><div><Binoculars size={44} /><h1>Mission not found</h1><p>This mission is not on this device and shared persistence may not be connected. Ask the creator for the complete portable link.</p><Link className="button button-primary" href="/explore">Create a new mission</Link></div></main>
    );
  }

  return (
    <main className="mission-page" id="main-content">
      <div className="mission-shell">
        <div className="mission-toolbar">
          <p>{mission.analysisSnapshot.dataStatus === "live" ? "Created from live data" : "Created from a labeled demo snapshot"}</p>
          <div className="mission-toolbar-actions">
            <button className="icon-button" onClick={() => window.print()} aria-label="Print mission"><Printer size={17} /></button>
            <button className="button button-dark button-small" onClick={() => void shareMission()}><Link2 size={15} />{shareLabel}</button>
          </div>
        </div>
        <article className="field-card">
          <header className="field-card-header">
            <div>
              <p className="mission-kicker">WildGap field mission · {mission.analysisSnapshot.confidence} confidence</p>
              <h1>Survey {mission.targetTaxon.toLowerCase()}</h1>
              <p className="mission-location"><MapPin size={16} />{mission.areaLabel} · {coordinates}</p>
            </div>
            <div className="score-seal"><div><strong>{mission.analysisSnapshot.gapScore ?? "—"}</strong><span>survey<br />priority</span></div></div>
          </header>
          <div className="field-card-body">
            <div className="mission-meta">
              <div><span>Date</span><strong>{humanDate(mission.scheduledDate)}</strong></div>
              <div><span>Effort</span><strong>{mission.durationMinutes} minutes</strong></div>
              <div><span>Target</span><strong>{mission.targetTaxon}</strong></div>
            </div>
            <section className="protocol">
              <p className="eyebrow"><ClipboardCheck size={13} /> Why this cell</p>
              <h2>A repeatable, useful outing</h2>
              <p>{mission.analysisSnapshot.explanation}</p>
              <ol>
                <li><span><strong>Choose a permitted public spot within the cell.</strong><br />Stay on marked paths and do not enter private, closed or unsafe areas.</span></li>
                <li><span><strong>Observe for a consistent 60 minutes.</strong><br />Photograph or record every target-group species you can confidently document.</span></li>
                <li><span><strong>Submit observations to a recognized platform.</strong><br />Use iNaturalist, eBird or your local biodiversity program and keep its public link.</span></li>
                <li><span><strong>Return and complete this mission.</strong><br />Add an evidence link when available. Zero observations are not treated as confirmed absence.</span></li>
              </ol>
            </section>
            <div className="safety-box"><ShieldAlert size={20} /><span><strong>Wildlife and access come first.</strong><br />Never disturb nests, handle wildlife, reveal sensitive-species locations or survey alone where conditions are unsafe.</span></div>
            <section className="completion-panel">
              {mission.status === "completed" ? (
                <div className="completed-banner"><CheckCircle2 /><div><strong>Mission completed</strong><span>{mission.completedAt ? new Date(mission.completedAt).toLocaleString() : "Completion saved"}</span>{mission.evidenceUrl && <a href={mission.evidenceUrl} target="_blank" rel="noreferrer">View evidence <ExternalLink size={12} style={{ display: "inline" }} /></a>}</div></div>
              ) : (
                <form onSubmit={completeMission}>
                  <h2>Back from the field?</h2>
                  <p>Mark the visit complete. An evidence link is useful but optional.</p>
                  <div className="completion-form"><input className="text-field" type="url" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="https://inaturalist.org/observations/…" aria-label="Optional evidence URL" /><button className="button button-primary" type="submit"><Check size={17} /> Complete</button></div>
                  {error && <p className="analysis-status error" role="alert">{error}</p>}
                </form>
              )}
            </section>
            <p className="source-fineprint">H3 cell {mission.h3Cell} · Analysis generated {new Date(mission.analysisSnapshot.generatedAt).toLocaleString()} · Observation coverage is not wildlife abundance.</p>
          </div>
        </article>
        <p style={{ textAlign: "center", marginTop: 24 }}><Link className="text-link" href="/explore"><CalendarDays size={14} style={{ display: "inline", marginRight: 6 }} />Plan another mission</Link></p>
      </div>
    </main>
  );
}
