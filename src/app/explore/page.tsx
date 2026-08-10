import type { Metadata } from "next";
import { ExplorerApp } from "@/components/explorer-app";

export const metadata: Metadata = {
  title: "Scout a habitat",
  description: "Map biodiversity observation gaps and turn one into a field mission.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  return (
    <main className="explore-page" id="main-content">
      <div className="shell explore-hero">
        <p className="eyebrow">Biodiversity survey copilot</p>
        <h1>Where should we look next?</h1>
        <p>Search a place, compare its observation coverage, then turn one candidate gap into a safe field mission.</p>
      </div>
      <div className="shell" style={{ paddingBottom: 80 }}>
        <ExplorerApp initialDemo={demo === "1"} />
      </div>
    </main>
  );
}
