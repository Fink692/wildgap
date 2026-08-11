# Pilot and usability results

Use this sheet during the real sessions. Do not enter estimates or reconstructed results.

## Automated and product verification — August 10, 2026

- TypeScript typecheck: passed
- Unit and API contract tests: 20/20 passed
- Production build: passed
- Production deployment: passed at `https://wildgap-habitat-2026.fink692.chatgpt.site`
- Winnipeg demo API: 200, 19 cells, 3 survey windows, labeled snapshot
- Uncached Winnipeg live API after concurrency tuning: 200, 19 cells, 9.07 seconds; progressive status shown throughout
- Uncached Saskatoon live API after rate-limit hardening: 200, 19 cells, 23.25 seconds; recovered from a transient upstream 503 while the progressive status remained active
- Complete-analysis cache verification: identical 19-cell request improved from 17.02 seconds live to 0.01 seconds cached, with explicit `MISS` then `HIT` response markers
- Global geocoding: verified with London, UK/Canada/US results
- End-to-end: demo → candidate → portable mission → evidence URL → completion passed
- Responsive checks: 390×844 and 1280×800 passed
- Browser console after final navigation check: no new errors
- Account-free mission architecture: no authentication client, user session, or mission database is required
- Portable mission boundary: payload length, route-ID binding, field ranges, and evidence URL schemes are validated before storage
- Independent application security scan: no high or critical findings; both medium findings fixed and regression-tested
- GBIF request scheduling: all 38 recent/prior cell-window comparisons retained, with a tested maximum of six concurrent occurrence searches and bounded retry of 429/502/503/504 responses

These technical checks do not replace the independent usability sessions or physical field pilot below.

## Winnipeg field mission

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

## Tester 1

- Date:
- Start-to-mission time:
- Completed without coaching: Yes / No
- Explained “survey priority” correctly: Yes / No
- Understood confidence and data status: Yes / No
- Main hesitation:
- Expected but could not find:

## Tester 2

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
