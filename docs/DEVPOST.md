# WildGap — Devpost submission draft

Repository: [github.com/Fink692/wildgap](https://github.com/Fink692/wildgap)

Production URL: [wildgap-habitat-2026.fink692.chatgpt.site](https://wildgap-habitat-2026.fink692.chatgpt.site)

## Inspiration

Conservation decisions depend on knowing what lives where, but biodiversity records are uneven. UNEP notes that monitoring often happens where resources already exist, not necessarily where threats are greatest. We wanted to turn that abstract data problem into one small action a student or community group could take this weekend.

## What it does

WildGap searches any location, divides it into comparable H3 cells, and reads observation coverage from GBIF. It compares the latest 12 months with the preceding three years, identifies recently under-observed taxonomic groups, and explains its confidence. Open-Meteo adds historical climate context and ranks comfortable field dates. A user can turn any candidate cell into a printable, shareable 60-minute survey mission and later mark it complete with an optional observation link.

WildGap deliberately does **not** claim that fewer observations mean fewer animals. Its output is survey priority, not habitat health or abundance.

## How we built it

- Next.js App Router, React, TypeScript and Tailwind CSS
- MapLibre with OpenFreeMap
- H3 adaptive spatial indexing
- GBIF occurrence and taxonomic APIs
- Open-Meteo geocoding, historical weather and forecast APIs
- Optional Supabase anonymous auth and Postgres RLS
- Portable mission payloads for a no-account, outage-resistant fallback

## Challenges

The hardest problem was scientific restraint. Opportunistic occurrence records contain spatial, temporal and observer bias. Instead of disguising that uncertainty, WildGap makes it part of the interface: explicit confidence thresholds, ranking suppression in low-data areas, source timestamps and plain-language limitations.

## Accomplishments

- One location-to-mission flow that works globally
- Live multi-source analysis with bounded concurrency and caching
- A complete keyboard-accessible alternative to the map
- Honest failure behavior: a clearly labeled Winnipeg snapshot or a retryable error, never silent estimates
- Shareable missions that remain functional without an account

## What we learned

Environmental technology earns trust by making uncertainty legible. The most useful output was not a complicated ecological prediction; it was a transparent recommendation that helps someone collect the next useful observation.

## What is next

Partner with school eco-clubs, validate target-group protocols with local naturalists, add optional eBird/iNaturalist submission integrations, and evaluate whether completed missions measurably improve spatiotemporal coverage.

## Before submitting

- [x] Add final live URL and public GitHub URL
- [ ] Complete the Winnipeg pilot and link evidence
- [ ] Add two tester results without inventing quotes
- [ ] Upload the 2:45 demo video
- [ ] Add project thumbnail and screenshots
- [ ] Confirm all team, eligibility and side-prize fields
- [ ] Verify attribution and repository access in a logged-out browser

## Prepared upload assets

- `assets/social-card.png` — 1200×630 project card
- `assets/architecture.svg` — architecture diagram
- `assets/screenshots/home-desktop.png`
- `assets/screenshots/explorer-desktop.png`
- `assets/screenshots/explorer-mobile.png`
- `assets/screenshots/mission-desktop.png`
- `assets/video/wildgap-pre-pilot.mp4` — truthful pre-pilot cut; replace its proof segment after the real sessions
