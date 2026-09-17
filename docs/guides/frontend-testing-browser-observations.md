# Part 8 browser observations

These checks use Chromium against a fresh production build with explicit API
interception. No API or database process is required. Viewports of 390 × 844
and the default desktop size were exercised on 2026-09-16.

| Area | Observed result |
| --- | --- |
| Routes and history | Guest public routes and protected redirect survive reload. Every protected route opens directly and reloads with an authenticated response. Back/Forward restores applied project filters. |
| Mobile navigation | The drawer opens from its labeled trigger, exposes account identity and disabled future items, navigates from a focused link, closes after selection, and dismisses with Escape. |
| Desktop navigation | The archive link alone reports the active page on the archive route, and the sidebar trigger changes its expanded/collapsed state. |
| Dialog and forms | The project dialog starts and keeps focus inside; Escape closes it and returns focus to New project. Enter submits the empty login form, focuses the invalid E-mail field, and exposes its error association. |
| Project tabs | ArrowRight, Home, and End move focus and selected state together; each selected tab has the matching visible panel. |
| Narrow content | Long code, a wide GFM table, a project description, and a long local path do not widen the document beyond the 390 CSS-pixel viewport. Code remains horizontally scrollable inside its block. |
| Feedback | A collection error has a named alert and keyboard-reachable retry. The built home screen renders its Markdown and notification; React Query Devtools are absent. |

Validation: `typecheck:e2e`, `lint`, `build`, and the 10 intercepted Chromium
tests pass. The focused Part 8 component suites pass. The aggregate Vitest
command currently reports 288 passing tests and one unrelated failure in
`technical-entry-api.spec.ts`: the newly added tag-assignment client calls
`POST /api/technical-entries/:id/tags` (plural), while its MSW test and Nest
controller use `/api/technical-entry/:id/tags` (singular). This work was added
concurrently and is outside Part 8.

The standalone `TagSelector` focus check remains pending because it has no
production route and Part 7 was skipped. No test-only production route was
introduced. The full-stack cookie/API journey remains Part 9.
