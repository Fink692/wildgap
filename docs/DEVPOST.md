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
- Validated portable mission payloads and device-local storage
- A fully account-free, outage-resistant mission workflow

## Challenges

The hardest problem was scientific restraint. Opportunistic occurrence records contain spatial, temporal and observer bias. Instead of disguising that uncertainty, WildGap makes it part of the interface: explicit confidence thresholds, ranking suppression in low-data areas, source timestamps and plain-language limitations.

## Accomplishments

- One location-to-mission flow that works globally
- Live multi-source analysis with bounded concurrency and caching
- A complete keyboard-accessible alternative to the map
- Score components exposed in both the explorer and field card
- A printable 60-minute protocol with weather, safety and readiness checks
- Honest failure behavior: a clearly labeled Winnipeg snapshot or a retryable error, never silent estimates
- Shareable missions that require no sign-in, account, or mission database
- A smaller privacy surface: mission history stays on-device and complete links carry only the field-card data a user chooses to share

## What we learned

Environmental technology earns trust by making uncertainty legible. The most useful output was not a complicated ecological prediction; it was a transparent recommendation that helps someone collect the next useful observation.

## What is next

Community users can run WildGap missions in permitted public locations and, if they choose, add observation evidence. Future work can validate target-group protocols with local naturalists, add optional eBird/iNaturalist integrations, and evaluate whether repeat use improves spatiotemporal coverage. No Winnipeg field mission is part of this submission.

## Before submitting

- [x] Add final live URL and public GitHub URL
- [x] State clearly that no field or tester results are claimed
- [x] Export and verify the 66-second product video
- [x] Add the Devpost project thumbnail
- [x] Prepare current desktop and mobile screenshots
- [ ] Confirm all team, eligibility and side-prize fields
- [ ] Verify attribution and repository access in a logged-out browser

## Prepared upload assets

- `assets/social-card.png` — 1200×630 project card
- `assets/architecture.svg` — architecture diagram
- `assets/screenshots/home-desktop.png`
- `assets/screenshots/explorer-desktop.png`
- `assets/screenshots/explorer-mobile.png`
- `assets/screenshots/mission-desktop.png`
- `assets/video/wildgap-final.mp4` — final 66-second product cut with no field/tester claim
