# Pilot and usability results

Use this sheet during the real sessions. Do not enter estimates or reconstructed results.

## Automated and product verification — August 12, 2026

- TypeScript typecheck: passed
- Unit and API contract tests: 24/24 passed
- Production build: passed
- Production deployment: passed at `https://wildgap-habitat-2026.fink692.chatgpt.site`
- Winnipeg demo API: 200, 7 cells, 3 survey windows, labeled snapshot
- Uncached live API: London 200 in 8.77 seconds, Tokyo 200 in 7.18 seconds, and New York 200 in 11.71 seconds; every response contained 7/7 complete cells and full weather context
- Complete-analysis cache verification: the same coordinates with a different display label returned an explicit `HIT` while preserving the new label
- Exact-location input: coordinate paste and map-pin flows verified; browser geolocation has a clear permission-denied fallback
- Global geocoding: first city match is selected automatically so analysis cannot silently reuse a previous location
- End-to-end: exact coordinate → live analysis → ranked candidate → portable mission → readiness checks → completion passed
- Responsive checks: 390×844 and 1280×800 passed
- Browser console after final navigation check: no new errors
- Account-free mission architecture: no authentication client, user session, or mission database is required
- Portable mission boundary: payload length, route-ID binding, field ranges, and evidence URL schemes are validated before storage
- Independent application security scan: no high or critical findings; both medium findings fixed and regression-tested
- GBIF request scheduling: 14 recent/prior cell-window comparisons, with a tested maximum of two concurrent occurrence searches, paced starts, and bounded retry of 429/502/503/504 responses
- Partial-source contract: one failed GBIF cell and both weather services unavailable still returned 6/7 honest cells, no estimates, explicit data quality, and a manual mission-date fallback
- Weather recovery: when the hosting worker cannot reach Open-Meteo, the browser retries the public CORS-enabled climate and forecast endpoints and preserves manual date entry if those also fail

These technical checks are the only evidence claimed by this submission. No independent usability result or physical field outing is claimed.

## Optional future Winnipeg field mission — not part of the submission

- Date and start time:
- Public, permitted site:
- Mission share URL:
- Target group:
- Actual duration:
- Weather notes:
- Priority cell visited: Yes / No
- Public evidence URL:
- Number of observations linked:
- Safety or protocol deviations:

## Optional future tester 1 — not part of the submission

- Date:
- Start-to-mission time:
- Completed without coaching: Yes / No
- Explained “survey priority” correctly: Yes / No
- Understood confidence and data status: Yes / No
- Main hesitation:
- Expected but could not find:

## Optional future tester 2 — not part of the submission

- Date:
- Start-to-mission time:
- Completed without coaching: Yes / No
- Explained “survey priority” correctly: Yes / No
- Understood confidence and data status: Yes / No
- Main hesitation:
- Expected but could not find:

## Verified product change

- Highest-impact issue found:
- Change made:
- Retest result:
