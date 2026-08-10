import { ImageResponse } from "next/og";

export const alt = "WildGap — Find nature's missing data, then go look";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#173f35", color: "#f5f0df", padding: 72, fontFamily: "sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "72%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 700 }}><span style={{ display: "flex", width: 38, height: 38, borderRadius: 20, background: "#e4a84d" }} />WildGap</div>
        <div style={{ display: "flex", flexDirection: "column" }}><div style={{ display: "flex", flexDirection: "column", fontSize: 72, lineHeight: 1.04, fontWeight: 600 }}><span>Nature has blind spots.</span><span>Let&apos;s go find them.</span></div><div style={{ marginTop: 26, fontSize: 26, opacity: 0.78 }}>Turn biodiversity observation gaps into field missions.</div></div>
        <div style={{ fontSize: 21, color: "#e4a84d", letterSpacing: 2 }}>HACK THE HABITAT 2026</div>
      </div>
      <div style={{ position: "absolute", right: -30, top: 90, width: 390, height: 390, borderRadius: 195, border: "2px solid rgba(245,240,223,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 260, height: 260, borderRadius: 130, border: "2px solid rgba(228,168,77,.65)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 130, height: 130, borderRadius: 65, background: "#e4a84d", display: "flex", alignItems: "center", justifyContent: "center", color: "#173f35", fontSize: 48, fontWeight: 700 }}>84</div></div>
      </div>
    </div>,
    size,
  );
}
