"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CloudSun,
  Database,
  Info,
  LoaderCircle,
  LocateFixed,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { HabitatMap } from "@/components/habitat-map";
import { persistMission } from "@/lib/mission-store";
import { encodeMission } from "@/lib/portable-mission";
import type { GeocodeResult, HabitatAnalysis, HabitatCell, Mission } from "@/lib/types";

const WINNIPEG: GeocodeResult = {
  id: 6183235,
  name: "Winnipeg",
  latitude: 49.8844,
  longitude: -97.14704,
  country: "Canada",
  admin1: "Manitoba",
  timezone: "America/Winnipeg",
};

function areaLabel(area: GeocodeResult) {
  return [area.name, area.admin1, area.country].filter(Boolean).join(", ");
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

export function ExplorerApp({ initialDemo = false }: { initialDemo?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("Winnipeg");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [area, setArea] = useState<GeocodeResult>(WINNIPEG);
  const [radiusKm, setRadiusKm] = useState(5);
  const [analysis, setAnalysis] = useState<HabitatAnalysis | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string>();
  const [searching, setSearching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("Building habitat cells…");
  const [error, setError] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [mountedDemo, setMountedDemo] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [creatingMission, setCreatingMission] = useState(false);

  const selectedCell = useMemo(
    () => analysis?.cells.find((cell) => cell.id === selectedCellId),
    [analysis, selectedCellId],
  );

  async function runAnalysis(forceDemo = false) {
    setAnalyzing(true);
    setAnalysisStage("Building habitat cells…");
    const stageTimers = [
      window.setTimeout(() => setAnalysisStage("Comparing GBIF observation windows…"), 1_200),
      window.setTimeout(() => setAnalysisStage("Adding climate and field conditions…"), 6_000),
      window.setTimeout(() => setAnalysisStage("Finishing the transparent score…"), 11_000),
    ];
    setError("");
    setSelectedCellId(undefined);
    try {
      const params = new URLSearchParams({
        lat: String(area.latitude),
        lng: String(area.longitude),
        radiusKm: String(radiusKm),
        label: areaLabel(area),
      });
      if (forceDemo) params.set("demo", "1");
      const response = await fetch(`/api/analysis?${params}`);
      const payload = (await response.json()) as HabitatAnalysis | { error: string };
      if (!response.ok || "error" in payload) throw new Error("error" in payload ? payload.error : "Analysis failed");
      setAnalysis(payload);
      const first = payload.cells[0];
      setSelectedCellId(first?.id);
      setScheduledDate(payload.surveyWindows[0]?.date ?? new Date().toISOString().slice(0, 10));
    } catch (reason) {
      setAnalysis(null);
      setError(reason instanceof Error ? reason.message : "Analysis failed. Please retry.");
    } finally {
      stageTimers.forEach(window.clearTimeout);
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (initialDemo && !mountedDemo) {
      setMountedDemo(true);
      void runAnalysis(true);
    }
  // run only for the incoming demo state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDemo, mountedDemo]);

  async function searchLocation(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setError("");
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      const payload = (await response.json()) as { results?: GeocodeResult[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Search failed");
      setResults(payload.results ?? []);
      if (!payload.results?.length) setError("No matching locations were found.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function chooseArea(result: GeocodeResult) {
    setArea(result);
    setQuery(result.name);
    setResults([]);
    setAnalysis(null);
    setSelectedCellId(undefined);
  }

  async function createMission(cell: HabitatCell) {
    if (!analysis) return;
    setCreatingMission(true);
    const mission: Mission = {
      id: crypto.randomUUID(),
      areaLabel: analysis.area.label,
      latitude: cell.center[1],
      longitude: cell.center[0],
      h3Cell: cell.id,
      polygon: cell.polygon,
      targetTaxon: cell.targetTaxon,
      analysisSnapshot: {
        gapScore: cell.gapScore,
        confidence: cell.confidence,
        explanation: cell.explanation,
        dataStatus: analysis.dataStatus,
        generatedAt: analysis.generatedAt,
      },
      scheduledDate,
      durationMinutes: 60,
      status: "planned",
      isPublic: true,
      createdAt: new Date().toISOString(),
    };
    const result = await persistMission(mission, captchaToken);
    const encoded = encodeMission(result.mission);
    router.push(`/missions/${mission.id}?data=${encoded}`);
  }

  return (
    <div className="explorer-layout">
      <aside className="explorer-sidebar" aria-label="Analysis controls and ranked results">
        <div className="control-block">
          <div className="control-label">1 · Choose a place <span>{area.admin1 ?? area.country}</span></div>
          <form className="search-form" onSubmit={searchLocation}>
            <div className="field-shell">
              <Search size={17} />
              <input className="text-field" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search for a city or place" autoComplete="off" />
              {results.length > 0 && (
                <ul className="search-results">
                  {results.map((result) => (
                    <li key={result.id}><button type="button" onClick={() => chooseArea(result)}><strong>{result.name}</strong><span>{[result.admin1, result.country].filter(Boolean).join(", ")}</span></button></li>
                  ))}
                </ul>
              )}
            </div>
            <button className="button button-dark search-submit" aria-label="Search" disabled={searching}>{searching ? <span className="spinner" /> : <ArrowRight size={17} />}</button>
          </form>
        </div>

        <div className="control-block">
          <div className="control-label">2 · Set the area <span>{radiusKm} km radius</span></div>
          <div className="radius-toggle" role="group" aria-label="Analysis radius">
            {[2, 5, 10].map((radius) => <button key={radius} type="button" className={radiusKm === radius ? "active" : ""} onClick={() => { setRadiusKm(radius); setAnalysis(null); }}>{radius} km</button>)}
          </div>
          <button className="button button-primary analyze-button" onClick={() => void runAnalysis(false)} disabled={analyzing}>
            {analyzing ? <><LoaderCircle size={18} className="spinner" /> {analysisStage}</> : <><LocateFixed size={18} /> Analyze this habitat</>}
          </button>
          <p className="status-note"><Info size={14} /> A first analysis can take 5–15 seconds; cached areas are faster. Coverage never means wildlife abundance.</p>
          {error && <div className="analysis-status error" role="alert"><AlertCircle size={15} />{error}</div>}
        </div>

        {analysis && (
          <>
            <div className={`analysis-status ${analysis.dataStatus}`}>
              {analysis.dataStatus === "live" ? <Database size={15} /> : <AlertCircle size={15} />}
              <span><strong>{analysis.dataStatus === "live" ? "Live analysis" : "Demo snapshot"}</strong><br />{analysis.dataStatusMessage}</span>
            </div>
            <div className="climate-card">
              <div className="climate-card-top"><span>{analysis.climate.comparisonMonth} context</span><CloudSun size={17} /></div>
              <div className="climate-card-metrics">
                <div><strong>{analysis.climate.temperatureAnomalyC === null ? "—" : `${analysis.climate.temperatureAnomalyC > 0 ? "+" : ""}${analysis.climate.temperatureAnomalyC}°`}</strong><small>temperature</small></div>
                <div><strong>{analysis.climate.precipitationPercentile === null ? "—" : `${analysis.climate.precipitationPercentile}th`}</strong><small>precip. percentile</small></div>
              </div>
              <p>{analysis.climate.summary}</p>
            </div>
            <div className="ranking-header"><h2>Candidate cells</h2><p>{analysis.rankingMessage}</p></div>
            <div className="cell-list" role="list" aria-label="Ranked survey candidate cells">
              {analysis.cells.map((cell, index) => (
                <div key={cell.id} role="listitem">
                  <button type="button" className={`cell-card ${selectedCellId === cell.id ? "selected" : ""}`} onClick={() => setSelectedCellId(cell.id)} aria-pressed={selectedCellId === cell.id}>
                    <span className={`score-orb ${cell.gapScore !== null && cell.gapScore < 50 ? "low" : ""}`}>{cell.gapScore ?? "—"}</span>
                    <span><strong>{analysis.rankingSuppressed ? "Exploratory cell" : `Priority #${index + 1}`}</strong><span>{cell.targetTaxon} · {cell.metrics.recentRecords.toLocaleString()} recent records</span></span>
                    <span className="confidence-pill">{cell.confidence}</span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>

      <section className="explorer-map-panel" aria-label="Habitat map and mission details">
        <HabitatMap analysis={analysis} selectedCellId={selectedCellId} onSelect={setSelectedCellId} />
        {analysis && <div className="map-legend"><strong>Survey priority</strong><div className="legend-gradient" /><div className="legend-labels"><span>lower</span><span>higher</span></div></div>}
        {analysis && selectedCell && (
          <div className="map-overlay">
            <button className="map-overlay-close" onClick={() => setSelectedCellId(undefined)} aria-label="Close cell details"><X size={17} /></button>
            <p className="eyebrow"><Sparkles size={13} /> Candidate mission</p>
            <h2>Survey {selectedCell.targetTaxon.toLowerCase()}</h2>
            <p>{selectedCell.explanation}</p>
            <div className="metric-row">
              <div><strong>{selectedCell.gapScore ?? "—"}</strong><span>gap score</span></div>
              <div><strong>{selectedCell.metrics.recentRecords.toLocaleString()}</strong><span>recent</span></div>
              <div><strong>{selectedCell.metrics.annualizedPriorRecords.toLocaleString()}</strong><span>prior / yr</span></div>
            </div>
            <div className="mission-form">
              <label><span><CalendarDays size={13} style={{ display: "inline", marginRight: 5 }} />Suggested survey date</span>
                <select className="select-field" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)}>
                  {analysis.surveyWindows.map((window) => <option key={window.date} value={window.date}>{dateLabel(window.date)} · {window.label} ({window.temperatureMaxC}°C, {window.precipitationProbability}% rain)</option>)}
                </select>
              </label>
              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} onSuccess={setCaptchaToken} options={{ size: "flexible", theme: "light" }} />
              )}
              <button className="button button-primary" disabled={creatingMission || Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken)} onClick={() => void createMission(selectedCell)}>
                {creatingMission ? <><span className="spinner" /> Saving mission…</> : <>Create 60-minute mission <ArrowRight size={17} /></>}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
