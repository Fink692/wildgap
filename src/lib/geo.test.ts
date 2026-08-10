import { describe, expect, it } from "vitest";
import { cellsForArea, polygonForCell } from "@/lib/geo";

describe("H3 coverage", () => {
  it.each([[2, 19], [5, 19], [10, 7]])("uses a bounded disk for a %s km area", (radius, expected) => {
    expect(cellsForArea(49.8844, -97.14704, radius)).toHaveLength(expected);
  });

  it("returns closed GeoJSON polygons", () => {
    const cell = cellsForArea(49.8844, -97.14704, 5)[0];
    const polygon = polygonForCell(cell);
    expect(polygon[0]).toEqual(polygon.at(-1));
    expect(polygon.length).toBeGreaterThan(6);
  });
});
