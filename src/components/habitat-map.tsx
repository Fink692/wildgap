"use client";

import { useEffect, useRef } from "react";
import type { GeocodeResult, HabitatAnalysis } from "@/lib/types";

export function HabitatMap({
  analysis,
  focus,
  selectedCellId,
  onSelect,
  onChooseCoordinates,
}: {
  analysis: HabitatAnalysis | null;
  focus: GeocodeResult;
  selectedCellId?: string;
  onSelect: (cellId: string) => void;
  onChooseCoordinates: (latitude: number, longitude: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const chooseCoordinatesRef = useRef(onChooseCoordinates);
  chooseCoordinatesRef.current = onChooseCoordinates;

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let map: import("maplibre-gl").Map;

    void import("maplibre-gl").then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      map = new maplibre.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [focus.longitude, focus.latitude],
        zoom: analysis ? (analysis.area.radiusKm === 2 ? 11.5 : analysis.area.radiusKm === 5 ? 10.5 : 9.4) : 11,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        if (!analysis) {
          new maplibre.Marker({ color: "#e4a84d" }).setLngLat([focus.longitude, focus.latitude]).addTo(map);
          map.on("click", (event) => chooseCoordinatesRef.current(event.lngLat.lat, event.lngLat.lng));
          map.getCanvas().style.cursor = "crosshair";
          return;
        }
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
  }, [analysis, focus.latitude, focus.longitude]);

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

  return <div ref={containerRef} className="map-container" role="region" aria-label={analysis ? `Survey-priority map for ${analysis.area.label}` : `Location picker centered on ${focus.name}`} />;
}
