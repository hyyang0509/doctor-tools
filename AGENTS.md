# AGENTS.md

## Purpose

This file defines how AI coding agents should work in this repository.

Before making changes, always read `README.md`.

If `PROGRESS.md` exists, read it when the task continues earlier work, spans multiple steps, or may depend on pending validation, an active branch, or an open Pull Request. For a clearly independent small task, a full progress review is optional.

`README.md` is the authoritative source for:
- project structure
- tool organization
- technical requirements
- privacy requirements
- validation and testing requirements
- PWA / Service Worker behavior
- GitHub branch and Pull Request workflow

`PROGRESS.md` is only a concise handoff checkpoint for unfinished or recently completed multi-step work. It must not duplicate the README or replace checking the repository, branch, PR, and test state.

Do not duplicate or override those rules unless explicitly instructed.

---

## Working principles

When modifying this repository:

1. Understand the existing implementation before changing it.
2. Preserve working functionality unless the task explicitly requires changing it.
3. Prefer small, targeted changes over unnecessary refactors.
4. Reuse existing structure, styles, patterns, and components whenever reasonable.
5. Keep the codebase simple and easy for future AI agents and humans to maintain.
6. Do not introduce unnecessary frameworks, dependencies, build systems, or backend services.
7. If a larger architectural change is genuinely beneficial, explain the reason and impact clearly.

## Config and modules

- For complex tools, put adjustable data, policy and parameters in config, and separate calculations and decisions into independent, testable modules.
- Small tools do not need modularization for its own sake. Avoid unnecessary files and complexity.
- Preserve the existing architecture when modifying a product. Split files only when they clearly cause maintenance difficulty, coupling or duplication.
- Config should be the single source of truth for policy parameters, numerical thresholds and static data; modules implement business logic. UI rendering must not decide medical or reimbursement eligibility.
- Keep initial treatment eligibility, continuation eligibility and treatment targets semantically separate.
- The purpose is greater reliability and a smaller scope (and token cost) for future AI changes, not architectural complexity.

---

## Product priorities

This project is a personal web-based toolbox intended for frequent practical use.

Prioritize, in this order:

1. Correctness
2. Reliability
3. Ease of use
4. Mobile usability
5. Maintainability
6. Visual polish

A visually attractive implementation is not acceptable if the underlying logic is unreliable.

---

## UI / UX

The interface should feel like a polished practical web app, not a developer dashboard.

Prefer:

- mobile-first responsive layouts
- clear visual hierarchy
- large and easy-to-tap controls
- obvious primary actions
- prominent results
- concise text
- consistent spacing and visual patterns
- simple, modern, professional styling

Avoid:

- unnecessary animations
- excessive decoration
- cluttered layouts
- overly technical UI
- unnecessary interaction steps

User-facing text should use Traditional Chinese unless otherwise requested.

Avoid Simplified Chinese wording and Mainland Chinese terminology.

---

## Functional correctness

For tools involving calculations, dates, medicine, finance, risk assessment, or other decision-support logic:

- verify the actual logic, not only the UI
- check edge cases
- verify invalid-input handling
- follow the validation requirements defined in `README.md`
- do not treat the absence of automated tests as permission to skip validation

If a calculation or rule is uncertain, do not invent the answer.

For medical tools in particular, preserve the distinction between:
- implemented calculation logic
- external medical guidance or guideline interpretation

Do not silently convert assumptions into medical rules.

---

## GitHub Pages compatibility

All changes must remain compatible with the repository's GitHub Pages deployment.

When relevant, verify:

- relative paths
- asset paths
- JavaScript loading
- page navigation
- filename case sensitivity
- Service Worker behavior
- mobile rendering

A feature working locally is not sufficient if it would fail after GitHub Pages deployment.

---

## Scope control

Do not expand the task unnecessarily.

For small requests:
- modify only what is needed
- avoid unrelated cleanup
- avoid broad rewrites

You may fix an obvious nearby bug if:
- the fix is low risk
- it is clearly related to the current work
- it does not significantly change existing behavior

Do not delete or substantially rewrite working features unless explicitly requested.

For irreversible, high-impact, or architecture-changing actions, explain the impact before proceeding.

---

## Token efficiency and handoff

Reduce wasted context without reducing implementation quality or requiring the user to manage technical details.

1. **Read selectively but sufficiently**: Start with `README.md`, relevant source files, and relevant tests. Avoid broad file dumps or unrelated history unless the task genuinely requires them.
2. **Keep outputs concise**: Do not paste entire files, large diffs, or raw logs into chat unless requested. Summarize code changes and test results; include only errors or excerpts needed for a decision.
3. **Prefer focused files, not arbitrary limits**: Keep each file cohesive and understandable. Split code only when responsibilities are clearly separable or testing and maintenance materially improve. Do not split files merely to meet a line-count target.
4. **Avoid repeated analysis**: Reuse verified repository facts within the same task, but re-check facts that may have changed, such as branch, PR, deployment, and test status.
5. **Use checkpoints only when useful**: Update `PROGRESS.md` for unfinished multi-step work, cross-chat handoff, unresolved medical or calculation decisions, pending validation, blockers, or meaningful work at risk of context loss. Do not update it for every completed small task.
6. **Keep checkpoints factual and current**: Record the active task, branch, PR, latest relevant commit, completed work, completed and pending validation, blockers, and exact next actions. Remove or replace stale active-task information after completion.
7. **Protect the vibe-coding workflow**: Token efficiency must never be used as a reason to skip implementation, tests, mobile checks, GitHub Pages checks, or a requested Pull Request. The agent should handle these steps without asking the user to restate repository rules.
8. **Before a likely interruption**: If substantial work remains and context is becoming constrained, commit a coherent checkpoint to the task branch when safe, update `PROGRESS.md`, and clearly distinguish completed, unverified, and pending work. Never mark an item complete merely because code was written.

---

## Decision-making

Do not stop for minor implementation decisions.

When requirements are slightly ambiguous:

1. infer the most reasonable interpretation from the existing project
2. follow `README.md`
3. follow existing UI and code patterns
4. choose the simplest reliable implementation
5. proceed

Ask for clarification only when different choices would:
- produce substantially different user-facing behavior
- risk data loss
- create a difficult-to-reverse change
- materially affect medical or calculation correctness

---

## Validation before completion

Before considering a task complete:

- verify the requested feature actually works
- check for JavaScript errors
- check for broken links or paths
- check for regressions
- verify relevant mobile behavior
- perform the required functional tests from `README.md`
- verify GitHub Pages compatibility where relevant

Do not report a task as complete solely because code was written.

---

## Communication

After completing a task, report briefly:

- what was changed
- what was validated
- any issue or limitation found
- whether any user action is still required

Keep implementation explanations concise unless more detail is requested.

Do not paste large amounts of code into the response unless specifically asked.

---

## Default behavior

The default approach should be:

**understand → modify minimally → validate carefully → report briefly**

Optimize for reliable vibe coding with minimal unnecessary back-and-forth.
