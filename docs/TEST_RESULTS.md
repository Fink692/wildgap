# Pilot and usability results

Use this sheet during the real sessions. Do not enter estimates or reconstructed results.

## Automated and product verification — August 10, 2026

- TypeScript typecheck: passed
- Unit, API contract and database-policy contract tests: 22/22 passed
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
- Supabase production schema: three migrations applied; RLS enabled; anonymous role limited to reads and authenticated role limited to mission CRUD
- Supabase security advisor: no findings; unauthenticated REST insert rejected with 401
- Independent application security scan: no high or critical findings; both medium findings fixed and regression-tested
- Cloudflare Turnstile: managed widget created for the exact production hostname; activation intentionally awaits the Supabase Auth CAPTCHA setting
- GBIF request scheduling: all 38 recent/prior cell-window comparisons retained, with a tested maximum of six concurrent occurrence searches and bounded retry of 429/502/503/504 responses

The live two-user Supabase isolation smoke test is ready as `pnpm test:supabase`. It must be run after anonymous sign-ins are enabled in the project dashboard.

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
