"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CloudSun,
  Database,
  Info,
  LoaderCircle,
  LocateFixed,
  Search,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import { HabitatMap } from "@/components/habitat-map";
import { persistMission } from "@/lib/mission-store";
import { encodeMission } from "@/lib/portable-mission";
import type { GeocodeResult, HabitatAnalysis, HabitatCell, Mission } from "@/lib/types";
import { recoverForecast } from "@/lib/weather";

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

function coordinateQuery(value: string) {
  const match = value.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

export function ExplorerApp({ initialDemo = false }: { initialDemo?: boolean }) {
  const [query, setQuery] = useState(initialDemo ? "Winnipeg" : "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [area, setArea] = useState<GeocodeResult>(WINNIPEG);
  const [areaConfirmed, setAreaConfirmed] = useState(initialDemo);
  const [radiusKm, setRadiusKm] = useState(5);
  const [analysis, setAnalysis] = useState<HabitatAnalysis | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string>();
  const [searching, setSearching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("Building habitat cells…");
  const [error, setError] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [mountedDemo, setMountedDemo] = useState(false);
  const [creatingMission, setCreatingMission] = useState(false);
  const [locating, setLocating] = useState(false);

  const selectedCell = analysis?.cells.find((cell) => cell.id === selectedCellId);

  async function runAnalysis(forceDemo = false) {
    if (!forceDemo && !areaConfirmed) {
      setError("Search and choose a location, paste coordinates, or drop a pin on the map first.");
      return;
    }
    setAnalyzing(true);
    setAnalysisStage(forceDemo ? "Loading the Winnipeg snapshot…" : "Building habitat cells…");
    const stageTimers = [
      window.setTimeout(() => setAnalysisStage("Comparing GBIF observation windows…"), 1_200),
      window.setTimeout(() => setAnalysisStage("Adding climate and field conditions…"), 4_000),
      window.setTimeout(() => setAnalysisStage("Finishing the transparent score…"), 8_000),
      window.setTimeout(() => setAnalysisStage("Waiting politely for a live data source…"), 14_000),
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
      const completePayload = await recoverForecast(payload);
      setAnalysis(completePayload);
      const first = completePayload.cells[0];
      setSelectedCellId(first?.id);
      setScheduledDate(completePayload.surveyWindows[0]?.date ?? new Date().toISOString().slice(0, 10));
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
    const coordinates = coordinateQuery(query);
    if (coordinates) {
      chooseCoordinates(coordinates.latitude, coordinates.longitude);
      return;
    }
    setSearching(true);
    setError("");
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
      const payload = (await response.json()) as { results?: GeocodeResult[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Search failed");
      const matches = payload.results ?? [];
      if (!matches.length) {
        setResults([]);
        setError("No matching city was found. Paste latitude, longitude or drop a pin on the map.");
      } else {
        chooseArea(matches[0]);
        setResults(matches.slice(1));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function chooseArea(result: GeocodeResult) {
    setArea(result);
    setQuery(result.name);
    setAreaConfirmed(true);
    setResults([]);
    setAnalysis(null);
    setSelectedCellId(undefined);
  }

  function chooseCoordinates(latitude: number, longitude: number) {
    const coordinateLabel = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    setArea({
      id: -Math.round((latitude + 90) * 100_000 + (longitude + 180) * 10),
      name: "Pinned location",
      latitude,
      longitude,
      country: "",
      admin1: coordinateLabel,
    });
    setQuery(coordinateLabel);
    setAreaConfirmed(true);
    setResults([]);
    setAnalysis(null);
    setSelectedCellId(undefined);
    setError("");
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Location access is unavailable in this browser. Paste latitude, longitude or drop a pin instead.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        chooseCoordinates(coords.latitude, coords.longitude);
        setLocating(false);
      },
      () => {
        setError("Your location was not shared. Paste latitude, longitude or drop a pin instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  async function createMission(cell: HabitatCell) {
    if (!analysis) return;
    setCreatingMission(true);
    setError("");
    try {
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
          metrics: cell.metrics,
        },
        surveyWindow: analysis.surveyWindows.find((window) => window.date === scheduledDate),
        scheduledDate,
        durationMinutes: 60,
        status: "planned",
        createdAt: new Date().toISOString(),
      };
      const savedMission = persistMission(mission);
      const encoded = encodeMission(savedMission);
      window.location.assign(`/missions/${mission.id}?data=${encoded}`);
    } catch {
      setError("The mission could not be saved on this device. Please retry.");
      setCreatingMission(false);
    }
  }

  return (
    <div className={`explorer-layout ${analysis ? "has-analysis" : ""}`}>
      <aside className="explorer-sidebar" aria-label="Analysis controls and ranked results">
        <div className="control-block">
          <div className="control-label">1 · Choose a place <span>{areaConfirmed ? area.admin1 ?? area.country : "Not selected"}</span></div>
          <form className="search-form" onSubmit={searchLocation}>
            <div className="field-shell">
              <Search size={17} />
              <input className="text-field" value={query} onChange={(event) => { setQuery(event.target.value); setAreaConfirmed(false); setResults([]); setAnalysis(null); }} aria-label="Search for a city or paste latitude and longitude" placeholder="City or 49.88, -97.14" autoComplete="off" />
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
          <div className="location-actions">
            <button type="button" onClick={useMyLocation} disabled={locating}><LocateFixed size={14} />{locating ? "Locating…" : "Use my location"}</button>
            <span>or click the map to drop a pin</span>
          </div>
          {areaConfirmed && <div className="selected-location"><strong>{areaLabel(area)}</strong><span>{area.latitude.toFixed(5)}, {area.longitude.toFixed(5)}</span></div>}
        </div>

        <div className="control-block">
          <div className="control-label">2 · Set the area <span>{radiusKm} km radius</span></div>
          <div className="radius-toggle" role="group" aria-label="Analysis radius">
            {[2, 5, 10].map((radius) => <button key={radius} type="button" className={radiusKm === radius ? "active" : ""} onClick={() => { setRadiusKm(radius); setAnalysis(null); }}>{radius} km</button>)}
          </div>
          <button className="button button-primary analyze-button" onClick={() => void runAnalysis(false)} disabled={analyzing || !areaConfirmed}>
            {analyzing ? <><LoaderCircle size={18} className="spinner" /> {analysisStage}</> : <><LocateFixed size={18} /> Analyze this habitat</>}
          </button>
          {analyzing && (
            <div className="analysis-progress" role="status" aria-live="polite">
              <span className="analysis-progress-bar" />
              <p>{analysisStage}<small>Live requests are paced and time-bounded. Missing cells are never filled with estimates.</small></p>
            </div>
          )}
          <p className="status-note"><Info size={14} /> Most first analyses finish in 5–15 seconds; cached areas are nearly instant. Coverage never means wildlife abundance.</p>
          {error && <div className="analysis-status error" role="alert"><AlertCircle size={15} />{error}</div>}
        </div>

        {analysis && (
          <>
            <div className="result-summary" aria-label="Analysis summary">
              <div><span>Area</span><strong>{analysis.area.radiusKm} km</strong></div>
              <div><span>Compared</span><strong>{analysis.dataQuality.completeCells}/{analysis.dataQuality.attemptedCells} cells</strong></div>
              <div><span>Source</span><strong>{analysis.dataStatus === "live" ? "Live" : "Snapshot"}</strong></div>
            </div>
            <div className={`analysis-status ${analysis.dataStatus} ${analysis.dataQuality.failedCellWindows ? "partial" : ""}`}>
              {analysis.dataStatus === "live" ? <Database size={15} /> : <AlertCircle size={15} />}
              <span><strong>{analysis.dataStatus === "live" ? "Live analysis" : "Demo snapshot"}</strong><br />{analysis.dataStatusMessage}<small>GBIF checked {new Date(analysis.sourceTimestamps.gbif).toLocaleString()} · Weather {analysis.dataQuality.weatherStatus.replace("-", " ")}</small></span>
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
            <details className="method-details">
              <summary><BarChart3 size={15} /> How survey priority works</summary>
              <p><strong>55% density gap</strong> + <strong>30% coverage change</strong> + <strong>15% target-group gap</strong>. Rankings are suppressed when the baseline is too thin.</p>
              <p>These are observation-coverage signals—not population, abundance or habitat-health estimates.</p>
            </details>
          </>
        )}
      </aside>

      <section className="explorer-map-panel" aria-label="Habitat map and mission details">
        <HabitatMap analysis={analysis} focus={area} selectedCellId={selectedCellId} onSelect={setSelectedCellId} onChooseCoordinates={chooseCoordinates} />
        {!analysis && <div className="map-empty-tip"><strong>Pin the exact survey area</strong><span>Click anywhere on the map, search a city, use your location, or paste coordinates.</span></div>}
        {analysis && <div className="map-legend"><strong>Survey priority</strong><div className="legend-gradient" /><div className="legend-labels"><span>lower</span><span>higher</span></div></div>}
        {analysis && selectedCell && (
          <div className="map-overlay">
            <button className="map-overlay-close" onClick={() => setSelectedCellId(undefined)} aria-label="Close cell details"><X size={17} /></button>
            <p className="eyebrow"><Sparkles size={13} /> Candidate mission</p>
            <h2>Survey {selectedCell.targetTaxon.toLowerCase()}</h2>
            <p>{selectedCell.explanation}</p>
            <div className="metric-row">
              <div><strong>{selectedCell.gapScore ?? "—"}</strong><span>priority</span></div>
              <div><strong>{selectedCell.metrics.recentRecords.toLocaleString()}</strong><span>recent</span></div>
              <div><strong>{selectedCell.metrics.annualizedPriorRecords.toLocaleString()}</strong><span>prior / yr</span></div>
            </div>
            <div className="score-breakdown" aria-label="Survey priority components">
              <div><span><Database size={13} /> Density gap</span><strong>{Math.round(selectedCell.metrics.densityGap * 100)}</strong></div>
              <div><span><BarChart3 size={13} /> Coverage change</span><strong>{Math.round(selectedCell.metrics.coverageChange * 100)}</strong></div>
              <div><span><Sprout size={13} /> Target gap</span><strong>{Math.round(selectedCell.metrics.targetGap * 100)}</strong></div>
            </div>
            <div className="mission-form">
              <label><span><CalendarDays size={13} style={{ display: "inline", marginRight: 5 }} />Suggested survey date</span>
                {analysis.surveyWindows.length ? (
                  <select className="select-field" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)}>
                    {analysis.surveyWindows.map((window) => <option key={window.date} value={window.date}>{dateLabel(window.date)} · {window.label} ({window.temperatureMaxC}°C, {window.precipitationProbability}% rain)</option>)}
                  </select>
                ) : <input className="text-field" type="date" value={scheduledDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setScheduledDate(event.target.value)} />}
              </label>
              <button className="button button-primary" disabled={creatingMission} onClick={() => void createMission(selectedCell)}>
                {creatingMission ? <><span className="spinner" /> Saving mission…</> : <>Create 60-minute mission <ArrowRight size={17} /></>}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
