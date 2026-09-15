# PROGRESS.md

**Last updated:** 2026-09-15

## Active task

- Lipid config + ES module refactor; implementation complete, real-browser validation pending.
- Branch: `refactor/lipid-config-modules`
- Base: `b977f64e1466fcaabd93d06b0473caa8bdaff73f` (main after PR #19)
- PR: draft to be opened; do not merge main.

## Completed

- Four config files, six focused modules and `app.mjs` orchestration; original UI/CSS and medical behavior preserved.
- AGENTS.md: added lightweight config/module principles without rewriting other rules.
- Service Worker v12 precaches new modules; new entry filename avoids v11 serving the old global-script app.
- 17 Node tests passed, including 17,780 patient / 640,080 drug-assessment comparisons against the fixed baseline.
- 12 jsdom interaction scenarios matched original result HTML; inputs/options/search/reset/error behavior passed.
- Relative imports, syntax, subpath HTTP resources and JavaScript MIME verified; CSS unchanged.

## Pending / blockers

- Actual 375px / 1280px browser checks, console, navigation and offline/cache-upgrade testing remain unverified.
- Local Chromium was unavailable and its download timed out. Cloud Browser rejected the local test URL (`ERR_BLOCKED_BY_CLIENT`). DOM tests do not verify visual rendering or Service Worker runtime.
- Actual GitHub Pages smoke test follows an authorized merge; no main deployment performed.

## Medical boundaries

- No rule changes. Preserve Table 1 interpretation of three-month exceptions; Table 2 remains unimplemented.
- Existing statin continuation and current combination-treatment identification limitations are documented in `lipid/VALIDATION.md`; do not infer new eligibility rules.

## Next actions

1. Finish real-browser tests in an environment that can serve this branch; use the checklist in `lipid/VALIDATION.md`.
2. Update PR validation status, then let the user review and merge.
