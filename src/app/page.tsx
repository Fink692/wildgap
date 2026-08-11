import {
  ArrowRight,
  Binoculars,
  CalendarCheck,
  Check,
  CloudSun,
  Database,
  Gauge,
  Layers3,
  Map,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ImpactStats } from "@/components/impact-stats";

const trustFacts = [
  { icon: Layers3, value: "7–19", label: "adaptive H3 cells", detail: "Enough local comparison without creating a wall of hexagons." },
  { icon: Database, value: "2", label: "observation windows", detail: "The latest 12 months versus an annualized three-year baseline." },
  { icon: Gauge, value: "50+", label: "records to rank", detail: "Below the evidence floor, WildGap suppresses the leaderboard." },
  { icon: ShieldCheck, value: "0", label: "population claims", detail: "A coverage gap is a reason to look—not evidence of ecological decline." },
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
              <a className="button button-primary" href="/explore">
                Scout a habitat <ArrowRight size={18} />
              </a>
              <a className="text-link" href="/explore?demo=1">See the Winnipeg demo</a>
            </div>
            <div className="hero-proof" aria-label="Product promises">
              <span><ShieldCheck size={15} /> No sign-up</span>
              <span><Database size={15} /> Open data</span>
              <span><Binoculars size={15} /> Field-ready</span>
            </div>
          </div>
          <figure className="product-preview">
            <img
              src="/wildgap-product.png"
              alt="WildGap's Winnipeg survey-priority map with a fungi mission selected"
              width={1180}
              height={720}
            />
            <figcaption><span className="live-dot" /> Real product view · Winnipeg demo snapshot</figcaption>
          </figure>
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

      <section className="section method-proof" aria-labelledby="score-heading">
        <div className="shell method-proof-grid">
          <div>
            <p className="eyebrow light">Transparent by construction</p>
            <h2 id="score-heading">A score you can challenge.</h2>
            <p className="method-intro">Every ranked cell exposes the same three ingredients. Climate data helps choose when to survey; it never changes the biodiversity gap score.</p>
            <div className="formula" aria-label="Gap score formula">
              <span>Survey priority</span>
              <strong>55% D + 30% C + 15% T</strong>
            </div>
          </div>
          <dl className="score-definitions">
            <div><dt>D · Density gap <span>55%</span></dt><dd>How sparse recent coordinate-valid records are per square kilometre compared with nearby cells.</dd></div>
            <div><dt>C · Coverage change <span>30%</span></dt><dd>Whether recent coverage is lower than the annualized observation baseline—not whether wildlife declined.</dd></div>
            <div><dt>T · Target gap <span>15%</span></dt><dd>Whether plants, fungi, birds or insects appeared nearby or historically but are under-observed recently.</dd></div>
          </dl>
        </div>
      </section>

      <section className="section case-study">
        <div className="shell pilot-grid">
          <div className="pilot-copy">
            <p className="eyebrow light">Winnipeg demo</p>
            <h2>Built locally.<br />Useful globally.</h2>
            <p>The timestamped Winnipeg snapshot makes the full product flow reviewable during third-party outages. This submission claims deployed software and technical verification—not a completed Winnipeg outing or independent human study.</p>
            <a className="button button-cream" href="/explore?demo=1">Open demo analysis <ArrowRight size={17} /></a>
          </div>
          <div className="pilot-status" aria-label="Winnipeg demo status">
            <p className="pilot-status-title">Verification ledger</p>
            <div className="status-row complete"><Check size={18} /><span><strong>Analysis built</strong><small>Timestamped Winnipeg snapshot and live retry</small></span><b>Ready</b></div>
            <div className="status-row complete"><Check size={18} /><span><strong>Mission protocol</strong><small>Printable, shareable 60-minute field card</small></span><b>Ready</b></div>
            <div className="status-row complete"><Check size={18} /><span><strong>Technical checks</strong><small>Scoring, APIs, sharing and production flow verified</small></span><b>Passed</b></div>
            <div className="status-row complete"><Check size={18} /><span><strong>Evidence boundary</strong><small>No field outing or human tester results claimed</small></span><b>Clear</b></div>
          </div>
        </div>
      </section>

      <section className="section shell" id="impact">
        <div className="section-heading centered-heading">
          <p className="eyebrow">Measured honestly</p>
          <h2>Count actions, not promises.</h2>
          <p>These privacy-friendly counters reflect missions created and completed on this device.</p>
        </div>
        <ImpactStats />
        <div className="trust-grid">
          {trustFacts.map(({ icon: Icon, value, label, detail }) => (
            <article key={label}><Icon size={21} /><strong>{value}</strong><h3>{label}</h3><p>{detail}</p></article>
          ))}
        </div>
        <div className="proof-note"><CalendarCheck size={19} /><p><strong>Judge the evidence, not the ambition.</strong> Planned surveys never count as completed visits, and evidence links remain optional but visible.</p></div>
      </section>

      <section className="cta-band">
        <div className="shell cta-inner">
          <div><p className="eyebrow light">Your neighbourhood is next</p><h2>Where should we look?</h2></div>
          <a className="button button-cream" href="/explore">Scout an area <ArrowRight size={18} /></a>
        </div>
      </section>
    </main>
  );
}
