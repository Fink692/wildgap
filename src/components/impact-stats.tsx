"use client";

import { useEffect, useState } from "react";
import type { Mission } from "@/lib/types";

export function ImpactStats() {
  const [stats, setStats] = useState({ planned: 0, completed: 0, evidence: 0 });

  useEffect(() => {
    const missions = Object.keys(localStorage)
      .filter((key) => key.startsWith("wildgap:mission:"))
      .map((key) => {
        try { return JSON.parse(localStorage.getItem(key) ?? "") as Mission; } catch { return null; }
      })
      .filter((mission): mission is Mission => Boolean(mission));
    setStats({
      planned: missions.length,
      completed: missions.filter((mission) => mission.status === "completed").length,
      evidence: missions.filter((mission) => Boolean(mission.evidenceUrl)).length,
    });
  }, []);

  return (
    <div className="impact-stats" role="group" aria-label="Your WildGap impact">
      <div><strong>{stats.planned}</strong><span>Missions planned</span></div>
      <div><strong>{stats.completed}</strong><span>Priority cells visited</span></div>
      <div><strong>{stats.evidence}</strong><span>Evidence links added</span></div>
    </div>
  );
}
