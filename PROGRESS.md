# PROGRESS.md

**Last updated:** 2026-10-20

## Latest task — manual food feedback

- Branch: `feat/food-log-ai-feedback`; implement day/seven-day feedback below the existing food form, using the same private Google Sheets receiver. Do not merge automatically.
- Apps Script version 3 adds authenticated analyze POST, backend-only OpenAI key, minimized food-only input, fingerprinted saved feedback, ten new requests/Taiwan day, and a short reservation lock that does not block normal uploads during the API call. Existing append/deduplication/queue format preserved.
- `SETUP.md` includes upgrading the existing bound script, adding `OPENAI_API_KEY`, editor-only `checkAIConnection` authorization and redeploying the same `/exec`. User reports original food uploads now succeed; old authorization incident is resolved from their perspective.
- Validation: 23 food-log tests; 44 with sarcopenia/taifex regressions passed. JS syntax and diff whitespace checked. Browser script expanded; local Chromium unavailable and download failed. New PR workflow runs Chromium/mobile/offline checks; inspect actual CI result before claiming browser validation.
- Unrelated baseline issue: lipid architecture test expects removed back link; no lipid code/test changed.
- Pending: PR review/merge, user's backend API key + new OAuth authorization + redeployment, actual AI response quality and Sheets feedback readback, Pages/mobile Safari smoke test after merge. No real food data or model call was used in tests.

## Earlier handoff (historical; re-check before resuming)

## Active task

- Sarcopenia MVP follow-up on branch `feat/sarcopenia-age-input-and-sync`.
- Age entry now supports direct age (default) or ROC birth year; validation and cloud/CSV fields are updated.
- Google Forms route was replaced with a smaller bound Apps Script receiver because the supplied first-event file is a blank Google Sheet and Cloud Browser cannot reach Google sign-in. Receiver source and deployment instructions are in `sarcopenia/google-apps-script/`.

## Completed

- Added the mobile-first `sarcopenia/` tool, AWGS 2025 rule module, local pending queue, duplicate warning, manual retry, CSV export, event locking and result workflow.
- Added the tool to the home page and Service Worker v13 offline cache.
- Four config files, six focused modules and `app.mjs` orchestration; original UI/CSS and medical behavior preserved.
- AGENTS.md: added lightweight config/module principles without rewriting other rules.
- Service Worker v12 precaches new modules; new entry filename avoids v11 serving the old global-script app.
- 17 Node tests passed, including 17,780 patient / 640,080 drug-assessment comparisons against the fixed baseline.
- 12 jsdom interaction scenarios matched original result HTML; inputs/options/search/reset/error behavior passed.
- Relative imports, syntax, subpath HTTP resources and JavaScript MIME verified; CSS unchanged.\n- First-event Apps Script was deployed and configured; live test record `TEST-001` populated all 18 columns in `工作表1` with correct numeric, boolean and blank values.

## Pending / blockers

- Deploy `sarcopenia/google-apps-script/Code.gs` from the first-event spreadsheet, fill its `/exec` URL into `sarcopenia/config.mjs`, then verify one test submission before field use.
- Actual 375px / 1280px browser checks, console, navigation and offline/cache-upgrade testing remain unverified.
- Local Chromium was unavailable and its download timed out. Cloud Browser rejected the local test URL (`ERR_BLOCKED_BY_CLIENT`). DOM tests do not verify visual rendering or Service Worker runtime.
- Actual GitHub Pages smoke test follows an authorized merge; no main deployment performed.

## Medical boundaries

- No rule changes. Preserve Table 1 interpretation of three-month exceptions; Table 2 remains unimplemented.
- Existing statin continuation and current combination-treatment identification limitations are documented in `lipid/VALIDATION.md`; do not infer new eligibility rules.

## Next actions

1. Finish real-browser tests in an environment that can serve this branch; use the checklist in `lipid/VALIDATION.md`.
2. Update PR validation status, then let the user review and merge.
