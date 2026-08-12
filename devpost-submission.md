# Title

WildGap

## One-line Summary

Find where biodiversity observation data is missing, then launch a safe field survey.

## Problem

Biodiversity records are uneven. Observations often cluster where people already look, leaving spatial and taxonomic gaps that make environmental monitoring less useful. A low record count, however, is not evidence that wildlife disappeared; it may simply mean that nobody looked recently.

School eco-clubs and citizen scientists can help, but raw occurrence databases do not tell them where another hour of observation would be most useful or how to turn a data gap into a safe, repeatable outing.

## Solution

WildGap searches any location, covers a 2, 5, or 10 kilometre area with comparable H3 cells, and queries coordinate-valid GBIF occurrence coverage. It compares the latest 12 completed months with the preceding 36-month baseline, identifies recently under-observed target groups, and explains every score component and confidence level.

Open-Meteo adds recent climate context and ranks upcoming field windows. A user can select a candidate cell and create a printable, shareable 60-minute mission with a target group, weather guidance, safety checks, a timed protocol, and an optional public evidence link.

WildGap calls the result **survey priority**. It never labels observation gaps as habitat health, species abundance, population decline, confirmed absence, or ecological causation.

## Product Tour

![WildGap explorer showing comparable H3 cells and a transparent survey-priority breakdown](https://raw.githubusercontent.com/Fink692/wildgap/main/docs/assets/screenshots/explorer-desktop.png)

![WildGap mobile field card showing a printable 60-minute fungi mission](https://raw.githubusercontent.com/Fink692/wildgap/main/docs/assets/screenshots/mission-mobile.png)

## Why This Matters

Environmental decisions are only as good as the observations behind them. WildGap turns an abstract monitoring gap into a concrete action that a student or community naturalist can take this weekend. It supports the challenge theme by combining real environmental data with an end-to-end conservation-monitoring workflow, while making sampling bias and uncertainty visible instead of hiding them.

The product reports only defensible action metrics: missions planned, missions completed, priority cells visited, and evidence links added. This submission claims deployed functionality and technical verification. It does not claim a completed field outing or independent human usability study.

## How We Used AI

WildGap does not use generative AI or a hosted model at runtime. The product's technical core is deterministic, inspectable geospatial computation over GBIF and Open-Meteo data. This was a deliberate choice: a survey-priority score that affects real field activity should be reproducible and explainable from its source data.

AI-assisted development was used through Codex to research implementation options, challenge unsupported ecological claims, implement and refactor the application, generate tests, diagnose live API behavior, review accessibility and security, and prepare deployment and submission materials. No model-generated ecological conclusions are shown to users.

## How We Used Codex

Codex worked as the coding and review partner across the build. It helped translate the product plan into a Next.js application; implement H3 coverage, GBIF/Open-Meteo integrations, ranking suppression, caching, portable mission validation, and accessible map alternatives; and test the complete location-to-mission flow.

During hardening, Codex measured uncached production behavior, found upstream concurrency and retry risks, added bounded request scheduling and cache verification, ran TypeScript and unit checks, reviewed the public repository for exposed secrets, and removed the unused sign-in stack when the product moved to a fully account-free design. The final deployment and this write-up were also prepared with Codex, with field and tester results deliberately left unclaimed.

## Key Features

- Global place search with 2, 5, and 10 kilometre analysis radii
- Focused seven-cell H3 coverage for fast, readable local comparisons
- Live GBIF comparison of the latest 12 months with the preceding 36 months
- Transparent `55% density gap + 30% coverage change + 15% target gap` score
- High, Medium, and Low confidence levels with low-data ranking suppression
- Target-group guidance for plants, fungi, birds, and insects
- Previous-month climate context and seven-day field-condition ranking
- MapLibre/OpenFreeMap map plus a keyboard-accessible ranked-list equivalent
- Printable 60-minute field mission with weather, safety, readiness, and evidence fields
- No accounts: mission history stays on-device and complete missions travel in validated portable links
- Clearly labeled Winnipeg demo snapshot for third-party outage resilience

## Architecture

WildGap uses Next.js App Router, React, TypeScript, Tailwind CSS, MapLibre, OpenFreeMap, and `h3-js`. Its server-side analysis route builds H3 geometry, queries GBIF occurrence counts with bounded concurrency and retries, retrieves Open-Meteo climate and forecast data, calculates the transparent score, and returns a serializable habitat analysis. Biodiversity metrics are cached for 24 hours and weather data for one hour. A complete labeled Winnipeg snapshot remains available for demo continuity and is never silently substituted for a global live result.

Missions require no authentication or central mission database. The browser validates the complete mission payload at the trust boundary, saves it in local storage, and embeds it in the portable share URL. Anyone holding the complete URL can read its field-card data, so the interface asks users to share intentionally and avoid sensitive evidence.

### Data and technology attribution

- [GBIF](https://www.gbif.org/) occurrence API; individual occurrence records retain their publisher licenses and citations
- [Open-Meteo](https://open-meteo.com/) geocoding, historical weather, and forecast APIs; weather data is CC BY 4.0 with attribution
- [OpenFreeMap](https://openfreemap.org/) map style, OpenMapTiles, and OpenStreetMap contributors
- [H3](https://h3geo.org/) spatial indexing library
- Next.js, React, TypeScript, Tailwind CSS, MapLibre GL JS, Lucide, Vitest, vinext, and Cloudflare/Sites deployment tooling under their respective licenses
- Original WildGap code is published under the MIT License

## Testing Instructions

### Fast judge path

1. Open the [live WildGap app](https://wildgap-habitat-2026.fink692.chatgpt.site/).
2. Choose **See the Winnipeg demo** for a fast, explicitly labeled snapshot path.
3. Select a candidate cell from either the map or ranked list.
4. Review the score components, confidence, climate context, and survey date.
5. Create the 60-minute mission, print or share its portable link, and mark it complete with or without a valid `https://` evidence URL.
6. Return to the homepage to see the device-local action counters.

### Live-data path

Open **Scout a habitat**, search a city, paste exact coordinates, use browser location, or click the map to drop a pin. Choose a radius and run the analysis. A first uncached result usually takes 5–15 seconds because GBIF requests are paced and rate-limit aware; progressive status remains visible. Confirm that the result identifies itself as live and shows explicit data completeness.

### Local verification

With Node.js 22+ and pnpm installed:

```bash
pnpm install
cp .env.example .env.local
pnpm test
pnpm typecheck
pnpm build
pnpm dev
```

No API keys or accounts are required. The current automated suite contains 24 passing unit and API-contract tests.

## Public Demo Link

https://wildgap-habitat-2026.fink692.chatgpt.site

## Public Repository Link

https://github.com/Fink692/wildgap

## Screenshot Shot List

- Homepage and problem framing: `docs/assets/screenshots/home-desktop.png`
- Global explorer and ranked cells: `docs/assets/screenshots/explorer-desktop.png`
- Mobile explorer: `docs/assets/screenshots/explorer-mobile.png`
- Complete field mission: `docs/assets/screenshots/mission-desktop.png`
- Mobile mission card: `docs/assets/screenshots/mission-mobile.png`
- Architecture diagram: `docs/assets/architecture.svg`
- Project/social card: `docs/assets/social-card.png`

## Submission Readiness Notes

- Devpost authentication: confirmed
- Hack the Habitat registration: confirmed
- Official form-specific questions: none
- Working demo requirement: satisfied by the public live app
- Public repository requirement: satisfied
- Written problem, implementation, and technology description: satisfied by this draft
- Third-party attribution requirement: satisfied in the Architecture section and repository README
- Video requirement: not required
- Automated tests: 24/24 passing
- Production deployment: responding successfully
- High-confidence secret scan: required again during the final submit review
- Evidence boundary: no field mission or independent human usability results are part of this submission

## Known Limitations

- GBIF occurrence coverage reflects observer effort and platform participation; it is not a census of wildlife.
- Sensitive-species locations may be generalized by source systems, and WildGap never exposes individual occurrence coordinates.
- Climate context helps schedule a survey but does not diagnose why biodiversity coverage changed.
- Live global analyses depend on third-party APIs and can be slow or temporarily unavailable.
- Portable mission URLs can be long. Anyone with the complete URL can read its field-card data.
- Mission history is device-local, so clearing browser storage removes the local copy; the complete portable link remains the transfer mechanism.
- No physical Winnipeg outing or independent human usability study is claimed.

## TODO Official Form Fields

The official Hack the Habitat submission requirements currently expose no custom form questions and do not request a Codex session ID.
