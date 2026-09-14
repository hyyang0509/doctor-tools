# PROGRESS.md

> Concise checkpoint for work that may need to continue in another chat. Repository rules and project structure belong in `README.md` and `AGENTS.md`.

**Last updated:** 2026-09-14

## Active task

- No unfinished implementation task is currently recorded.
- Before resuming work, verify the current GitHub branch, open PRs, deployed Pages version, and relevant tests rather than relying on this file alone.

## Latest completed milestone

### Lipid drug-assessment wording and eligibility alignment

- PR: [#17](https://github.com/hyyang0509/doctor-tools/pull/17) — merged into `main`
- Completed:
  - separated medication eligibility from LDL target status
  - corrected ongoing statin wording after LDL reaches target
  - tightened the ezetimibe statin-intolerance path
  - clarified that reaching target does not imply stopping treatment
  - updated related tests and Service Worker cache to v11

## Validation state

- [x] `node --test lipid/rules.test.js lipid/refactor.test.js` — 14/14 passed
- [x] JavaScript syntax checks passed for the modified lipid modules
- [ ] Perform a post-deployment smoke test on GitHub Pages
- [ ] Confirm interactive layout at approximately 375px and 1280px when a browser environment is available

## Known follow-up

- Complete the Table 2 reimbursement logic only after the full official text is available and clinically confirmed.
- Do not infer missing medical reimbursement rules from UI wording or secondary summaries.

## Important decisions

- For the relevant three-month exception pathway, use the confirmed Table 1 target interpretation unless official wording explicitly says otherwise.
- Existing eligible statin treatment is not reclassified as ineligible merely because LDL has reached target.
- `PROGRESS.md` records handoff state only; it should not become a duplicate README or an indefinite change log.

## Checkpoint maintenance

Update this file only when work is unfinished across chats, validation remains pending, a blocker or important decision must be preserved, or substantial work is at risk of context loss.

When updating it:

1. replace stale active-task information instead of appending endlessly
2. include branch, PR, and relevant commit when available
3. distinguish completed, verified, unverified, and pending work
4. state the next one to three concrete actions
5. remove resolved blockers and obsolete instructions
