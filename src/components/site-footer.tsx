import { Leaf } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <div className="brand brand-light"><span className="brand-mark"><Leaf size={17} /></span>WildGap</div>
          <p>Find where nature data is missing, then go look.</p>
        </div>
        <div>
          <p className="footer-label">Open data</p>
          <a href="https://www.gbif.org/" target="_blank" rel="noreferrer">GBIF</a>
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
          <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a>
        </div>
        <div>
          <p className="footer-label">Explore</p>
          <a href="/explore">Scout a habitat</a>
          <a href="/#method">Read the method</a>
          <a href="https://github.com/Fink692/wildgap" target="_blank" rel="noreferrer">Source code</a>
          <a href="https://hack-the-habitat-2026.devpost.com/" target="_blank" rel="noreferrer">Hack the Habitat</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>Built for Hack the Habitat 2026.</span>
        <span>Observation coverage ≠ wildlife abundance.</span>
      </div>
    </footer>
  );
}
