# PROGRESS.md

**Last updated:** 2026-09-23

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
- Relative imports, syntax, subpath HTTP resources and JavaScript MIME verified; CSS unchanged.

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
