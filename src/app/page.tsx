import Link from "next/link";
import {
  ArrowRight,
  Binoculars,
  Check,
  CloudSun,
  Database,
  Map,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ImpactStats } from "@/components/impact-stats";

const rubric = [
  ["30%", "Impact", "A field mission, not another passive dashboard."],
  ["25%", "Technology", "Live biodiversity, weather and geospatial analysis."],
  ["20%", "Usability", "From location search to field card in under three minutes."],
];

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={14} /> Built for Hack the Habitat 2026</p>
            <h1>Nature has blind spots.<br /><em>Let&apos;s go find them.</em></h1>
            <p className="hero-lede">
              WildGap turns uneven biodiversity records into clear, safe field missions for school eco-clubs and citizen scientists.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/explore">
                Scout a habitat <ArrowRight size={18} />
              </Link>
              <Link className="text-link" href="/explore?demo=1">See the Winnipeg demo</Link>
            </div>
            <p className="hero-note"><ShieldCheck size={16} /> No sign-up required. No population claims. Open data, plainly explained.</p>
          </div>
          <div className="hero-visual" role="img" aria-label="Preview of WildGap survey-priority map">
            <div className="topographic-rings" aria-hidden="true" />
            <div className="map-card map-card-main">
              <div className="map-card-label"><span className="live-dot" /> Winnipeg · live area</div>
              <div className="hex-field" aria-hidden="true">
                <span className="hex h1">73</span><span className="hex h2">61</span><span className="hex h3">84</span>
                <span className="hex h4">42</span><span className="hex h5">68</span><span className="hex h6">55</span>
              </div>
              <div className="map-scale"><span>Lower gap</span><i /><span>Higher gap</span></div>
            </div>
            <div className="floating-card mission-peek">
              <span className="icon-chip"><Binoculars size={17} /></span>
              <div><small>Top mission</small><strong>Survey insects</strong><span>Wednesday · 60 min</span></div>
            </div>
            <div className="floating-card data-peek"><Database size={16} /><span>Live GBIF records</span></div>
          </div>
        </div>
      </section>

      <section className="problem-strip">
        <div className="shell strip-grid">
          <p className="strip-kicker">The problem</p>
          <p className="strip-quote">“Data is often collected where resources are available, not necessarily where biodiversity threats are greatest.”</p>
          <a href="https://www.unep.org/interactives/nature-action-note/" target="_blank" rel="noreferrer">UNEP Nature Action Note ↗</a>
        </div>
      </section>

      <section className="section shell" id="method">
        <div className="section-heading split-heading">
          <div><p className="eyebrow">From gap to action</p><h2>One question.<br />One useful next step.</h2></div>
          <p>WildGap never says fewer records mean fewer animals. It asks a narrower, defensible question: where would another observation improve coverage most?</p>
        </div>
        <div className="steps-grid">
          <article><span className="step-number">01</span><Map size={24} /><h3>Pick a place</h3><p>Search anywhere on Earth and choose a two, five or ten kilometre area.</p></article>
          <article><span className="step-number">02</span><Database size={24} /><h3>Read the gaps</h3><p>Compare recent GBIF observation coverage with the three-year baseline across H3 cells.</p></article>
          <article><span className="step-number">03</span><CloudSun size={24} /><h3>Choose a window</h3><p>Use weather conditions and historical climate context to plan a comfortable outing.</p></article>
          <article><span className="step-number">04</span><Binoculars size={24} /><h3>Go observe</h3><p>Take a printable mission card, survey safely and link evidence when you return.</p></article>
        </div>
      </section>

      <section className="section case-study">
        <div className="shell case-grid">
          <div className="case-visual">
            <div className="case-stamp">WINNIPEG PILOT<br /><strong>49.8844° N</strong></div>
            <div className="case-circles" aria-hidden="true"><i /><i /><i /><i /></div>
          </div>
          <div className="case-copy">
            <p className="eyebrow light">The pilot</p>
            <h2>A global tool.<br />A local proof.</h2>
            <p>Winnipeg is the first end-to-end demonstration: identify a candidate monitoring gap, create a public-area mission, complete a 60-minute survey and link the resulting observation evidence.</p>
            <ul className="check-list">
              <li><Check size={17} /> Live and transparently timestamped data</li>
              <li><Check size={17} /> A real field outing, not simulated impact</li>
              <li><Check size={17} /> Two uncoached usability tests</li>
            </ul>
            <Link className="button button-cream" href="/explore?demo=1">Open pilot analysis <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <section className="section shell" id="impact">
        <div className="section-heading centered-heading">
          <p className="eyebrow">Measured honestly</p>
          <h2>Count actions, not promises.</h2>
          <p>These counters update from missions on this device until shared Supabase persistence is connected.</p>
        </div>
        <ImpactStats />
        <div className="rubric-grid">
          {rubric.map(([percent, label, detail]) => (
            <article key={label}><strong>{percent}</strong><h3>{label}</h3><p>{detail}</p></article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div className="shell cta-inner">
          <div><p className="eyebrow light">Your neighbourhood is next</p><h2>Where should we look?</h2></div>
          <Link className="button button-cream" href="/explore">Scout an area <ArrowRight size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
