import type { Metadata } from "next";
import { MissionView } from "@/components/mission-view";

export const metadata: Metadata = {
  title: "Field mission",
  description: "A safe, shareable citizen-science field mission from WildGap.",
};

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MissionView missionId={id} />;
}
