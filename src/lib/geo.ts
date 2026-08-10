import {
  cellArea,
  cellToBoundary,
  cellToLatLng,
  gridDisk,
  latLngToCell,
  UNITS,
} from "h3-js";

export function cellsForArea(latitude: number, longitude: number, radiusKm: number) {
  const resolution = radiusKm <= 2 ? 8 : radiusKm <= 5 ? 7 : 6;
  const ringSize = radiusKm >= 10 ? 1 : 2;
  return gridDisk(latLngToCell(latitude, longitude, resolution), ringSize);
}

export function polygonForCell(cell: string): [number, number][] {
  const boundary = cellToBoundary(cell, true) as [number, number][];
  return [...boundary, boundary[0]];
}

export function centerForCell(cell: string): [number, number] {
  const [latitude, longitude] = cellToLatLng(cell);
  return [longitude, latitude];
}

export function areaForCell(cell: string) {
  return cellArea(cell, UNITS.km2);
}

export function polygonWkt(polygon: [number, number][]) {
  return `POLYGON((${polygon.map(([longitude, latitude]) => `${longitude} ${latitude}`).join(",")}))`;
}
