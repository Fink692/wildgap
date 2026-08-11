# Submission operations checklist

## Accounts and compliance

- [x] Register the eligible entrant on Devpost (verified August 10, 2026).
- [ ] Join the organizer Discord.
- [ ] Ask organizers to clarify build dates, eligibility wording, prize tracks, and post-deadline bug fixes.
- [ ] Confirm the entrant and any teammates meet the published eligibility rules.

## Evidence

- [ ] Complete the Winnipeg field mission using `PILOT_PROTOCOL.md`.
- [ ] Record verified results in `TEST_RESULTS.md`.
- [ ] Run two uncoached usability sessions and record their measured times.
- [ ] Add only public, non-sensitive evidence URLs.

## Production controls

- [x] Apply the production mission schema and row-level security policies.
- [x] Restrict anonymous database access to public reads; require an authenticated owner for writes.
- [x] Create the production Turnstile widget for the deployed hostname.
- [ ] Enable anonymous sign-ins and Turnstile CAPTCHA in Supabase Auth, then run `pnpm test:supabase`.

## Final media

- [ ] Replace the proof placeholders in `VIDEO_SCRIPT.md` with verified facts.
- [ ] Record or replace the proof segment with the real outing and tester evidence.
- [ ] Verify captions, audio, and the exported H.264 video.
- [ ] Capture current desktop and mobile screenshots from the production deployment.

## Devpost

- [ ] Add the production URL and public repository URL.
- [ ] Upload the final video, thumbnail, screenshots, and architecture image.
- [ ] Paste and proofread `DEVPOST.md`.
- [ ] Verify all data/API attribution and the MIT license.
- [ ] Test every link in a logged-out browser.
- [ ] Submit several hours before August 30, 2026 at 11:45 PM CDT.
