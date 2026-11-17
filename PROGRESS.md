# PROGRESS.md

**Last updated:** 2026-11-18

## Active task — food logging habits

- PR [#40](https://github.com/hyyang0509/doctor-tools/pull/40), branch `feat/food-log-habits`; not merged. Main remains unchanged.
- Added device-local confirmed today/recent history (300 saved, latest30 shown) with same-ID editing, user-defined meal templates (max20; food/portions only), starch portions and three-state water observations for morning/afternoon/evening. Only explicit observations are stored; no nutrient estimates are invented. Templates/history do not sync across devices or import old sheet rows.
- Receiver v3 preserves original nine columns and connection key, adds structured observations in column10, supports safe same-ID updates while retaining original creation time. Old receiver still supports new append records via human-readable content; editing requires v3.
- Telegram editor-only setup verifies delivery and installs one ~20:30 Asia/Taipei missing-meal trigger. Credentials stay in Script Properties; water-only rows do not count as meals. No live reminder has been enabled.
- 30 Node tests pass locally. Expanded browser checks cover templates, water-only upload/status, history edit/reload, reminder deep links and draft protection as well as earlier 320–1280px/SW checks. Browser suite runs in PR CI because local Chromium is blocked by socket restrictions; see PR checks for current result. All cloud responses are mocked.
- Remaining rollout: review/merge PR, update bound Apps Script from Code.gs, run setup/checkConnection, redeploy existing /exec as v3; run setupTelegramReminders with own Bot token/private chat ID and testTelegramReminder. Then verify real sheet write/edit and Telegram delivery on phone. Setup instructions are in food-log/google-apps-script/SETUP.md.

## Previous task — nutrition supplements and drinks

- PR [#32](https://github.com/hyyang0509/doctor-tools/pull/32), branch `feat/food-log-nutrition-tags`, implementation commit `bc390ce7704126f461e05d5b137ee59c1c130a3c`; ready for review, not merged.
- Added optional collapsed vegetables/protein/fruit/dairy controls and per-drink added-sugar choices. Supplement text goes to the existing content column; no receiver or connection update needed. Preserve legacy drafts, pending IDs and original tag allowlist. SW v23.
- 17 food tests / 38 combined tests passed. CI run 39708624721 and local Chromium mobile/desktop/navigation/SW offline checks passed; screenshots inspected with Traditional Chinese fonts. All cloud replies mocked; live Pages/Safari/Google confirmation follows merge.
- Earlier AI feedback PR #31 remains open and separate. Both touch shared frontend/SW files; reconcile them when integrating. This branch contains only nutrition/drink work, no new AI service.
- Details and limitations: `food-log/VALIDATION.md`.

## Previous task — daily food log

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
