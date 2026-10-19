# PROGRESS.md

**Last updated:** 2026-10-20

## Latest task — daily food log

- Follow-up branch `fix/food-log-sheet-authorization`: fixed original current-document scope conflict with openById, added setup authorization check, editor-only checkConnection, safe receiver diagnostics and UI hints, receiver version 2 and SW v21. Fourteen tests and Chromium regression passed. User still needs to update their bound script, reauthorize and deploy the new receiver; reported production failure has not yet been retested live. PR #29 is merged.

- Branch: `feat/daily-food-log`; ready for PR review, do not merge automatically.
- Implemented `food-log/`: mobile form, 14 emoji tags, Taiwan date/meal defaults, optional work/notes, local draft and pending queue, acknowledged Google Sheets upload, stable-ID retries and Apps Script receiver with private device-configured access key.
- Added homepage entry/search and Service Worker v20 offline assets. Existing tools preserved.
- Validation: 11 new tests and 32 combined tests passed; Chromium 320–1280px interaction/layout, navigation, JS error and SW/offline checks passed. Full scope/limits: `food-log/VALIDATION.md`.
- Google Sheet created with nine columns; native metadata/header readback verified. Its URL is provided privately in chat, not committed here.
- Pending: user installs receiver in their bound Apps Script, runs `setup`, authorizes and deploys it, then pastes `/exec` and key into the tool. Actual Google end-to-end acknowledgement is unverified until that deployment. GitHub Pages smoke test follows merge.

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
