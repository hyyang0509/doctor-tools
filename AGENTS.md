# AGENTS.md

## Project purpose

This repository contains my personal web-based tools, including medical, work, and daily-life utilities.

The site is deployed using GitHub Pages.

The primary goal is to keep the project:

* simple
* reliable
* mobile-friendly
* easy to maintain
* easy for AI coding agents to modify

## General working principles

Before making changes:

1. Inspect the repository structure and understand the existing implementation.
2. Avoid breaking working features.
3. Prefer minimal, targeted changes for small requests.
4. Do not perform unnecessary large-scale refactors.
5. Reuse existing patterns, styles, components, and file structure whenever reasonable.

## UI / UX

The site should feel like a practical, polished web app rather than a developer dashboard.

Priorities:

* Mobile-first responsive design
* Clean and modern appearance
* Clear visual hierarchy
* Large, easy-to-tap controls
* Minimal unnecessary text
* Important results should be visually prominent
* Avoid excessive animations or decorative effects

Use Traditional Chinese for user-facing text unless otherwise requested.

Avoid Simplified Chinese wording and Mainland Chinese terminology.

## Functional correctness

Correctness is more important than visual appearance.

For tools involving:

* dates
* medical calculations
* numerical calculations
* risk assessments
* medication-related calculations
* financial calculations

carefully verify the logic and edge cases.

Do not assume calculations are correct just because the interface works.

## Technical preferences

Prefer:

* HTML
* CSS
* JavaScript

when these are sufficient.

Avoid adding unnecessary frameworks, build systems, backend services, or dependencies.

If the repository already uses a framework or established architecture, follow the existing approach instead of replacing it without a strong reason.

The site must work correctly when deployed through GitHub Pages.

Pay special attention to:

* relative paths
* asset paths
* JavaScript loading
* links between pages
* case-sensitive filenames
* mobile layout

## New tools

When adding a new tool:

1. Place it in the appropriate category.
2. Provide a clear entry point from the main page or navigation.
3. Reuse the existing visual style.
4. Keep the workflow simple.
5. Minimize the number of user actions required.
6. Make the primary action and result obvious.

## Validation

After changes, check for:

* JavaScript errors
* broken links
* incorrect file paths
* GitHub Pages deployment issues
* mobile layout problems
* calculation edge cases
* regressions in existing features

If tests exist, run the relevant tests.

If no automated tests exist, perform reasonable manual validation.

## Scope of changes

Do not delete or substantially rewrite existing working functionality unless explicitly requested.

You may directly fix obvious bugs discovered while completing a task.

For changes that significantly alter architecture, stored data, or existing behavior, explain the impact before making irreversible changes.

## Communication

After completing a task, summarize briefly:

* what was changed
* any bugs or issues found
* any important follow-up action required

Do not provide long explanations of implementation details unless requested.

## Decision-making

When requirements are slightly ambiguous, make reasonable decisions based on the principles above and proceed.

Do not stop for minor implementation choices.

Ask for clarification only when different choices would produce substantially different results, risk data loss, or create difficult-to-reverse changes.
