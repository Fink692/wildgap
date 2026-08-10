"use client";

import { useEffect, useRef } from "react";
import { MapPinned } from "lucide-react";
import type { HabitatAnalysis } from "@/lib/types";

export function HabitatMap({
  analysis,
  selectedCellId,
  onSelect,
}: {
  analysis: HabitatAnalysis | null;
  selectedCellId?: string;
  onSelect: (cellId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || !analysis) return;
    let cancelled = false;
    let map: import("maplibre-gl").Map;

    void import("maplibre-gl").then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      map = new maplibre.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [analysis.area.longitude, analysis.area.latitude],
        zoom: analysis.area.radiusKm === 2 ? 11.5 : analysis.area.radiusKm === 5 ? 10.5 : 9.4,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        const features = analysis.cells.map((cell) => ({
          type: "Feature" as const,
          properties: {
            id: cell.id,
            score: cell.gapScore ?? -1,
            selected: cell.id === selectedCellId ? 1 : 0,
          },
          geometry: { type: "Polygon" as const, coordinates: [cell.polygon] },
        }));
        map.addSource("habitat-cells", {
          type: "geojson",
          data: { type: "FeatureCollection", features },
        });
        map.addLayer({
          id: "habitat-fill",
          type: "fill",
          source: "habitat-cells",
          paint: {
            "fill-color": [
              "case",
              ["<", ["get", "score"], 0], "#b8bdb3",
              ["interpolate", ["linear"], ["get", "score"], 0, "#adc9a8", 50, "#d6bf76", 100, "#e19547"],
            ],
            "fill-opacity": ["case", ["==", ["get", "selected"], 1], 0.86, 0.58],
          },
        });
        map.addLayer({
          id: "habitat-outline",
          type: "line",
          source: "habitat-cells",
          paint: {
            "line-color": ["case", ["==", ["get", "selected"], 1], "#0b2923", "#355f51"],
            "line-width": ["case", ["==", ["get", "selected"], 1], 3, 1.25],
          },
        });
        map.on("mouseenter", "habitat-fill", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "habitat-fill", () => { map.getCanvas().style.cursor = ""; });
        map.on("click", "habitat-fill", (event) => {
          const id = event.features?.[0]?.properties?.id as string | undefined;
          if (id) selectRef.current(id);
        });
        const bounds = new maplibre.LngLatBounds();
        analysis.cells.forEach((cell) => cell.polygon.forEach(([longitude, latitude]) => bounds.extend([longitude, latitude])));
        map.fitBounds(bounds, { padding: 65, duration: 0 });
      });
    });

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, [analysis]);

  useEffect(() => {
    if (!analysis || !mapRef.current?.isStyleLoaded()) return;
    const source = mapRef.current.getSource("habitat-cells") as import("maplibre-gl").GeoJSONSource | undefined;
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features: analysis.cells.map((cell) => ({
        type: "Feature" as const,
        properties: {
          id: cell.id,
          score: cell.gapScore ?? -1,
          selected: cell.id === selectedCellId ? 1 : 0,
        },
        geometry: { type: "Polygon" as const, coordinates: [cell.polygon] },
      })),
    });
  }, [analysis, selectedCellId]);

  if (!analysis) {
    return (
      <div className="map-placeholder">
        <div><MapPinned size={36} /><strong>Your map starts here</strong><p>Search a place and run the analysis to reveal candidate observation gaps.</p></div>
      </div>
    );
  }
  return <div ref={containerRef} className="map-container" role="region" aria-label={`Survey-priority map for ${analysis.area.label}`} />;
}
