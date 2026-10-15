# Browser test observations

These checks use Chromium against a fresh production build with explicit API
interception. No API or database process is required. Viewports of 390 × 844
and the default desktop size were first exercised on 2026-09-16. The suite was
updated on 2026-10-15 to follow the current dashboard route and sidebar labels,
exercise every protected route, and check card link names in Chromium.

| Area | Observed result |
| --- | --- |
| Routes and history | Guest public routes and protected redirect survive reload. Every protected route opens directly and reloads with an authenticated response. Back/Forward restores applied project filters. |
| Mobile navigation | The drawer opens from its labeled trigger, exposes account identity and the enabled Quick Capture action, navigates from a focused link, closes after selection, and dismisses with Escape. |
| Desktop navigation | The archive link alone reports the active page on the archive route, and the sidebar trigger changes its expanded/collapsed state. |
| Dialog and forms | The project dialog starts and keeps focus inside; Escape closes it and returns focus to New project. Enter submits the empty login form, focuses the invalid E-mail field, and exposes its error association. |
| Project tabs | ArrowRight, Home, and End move focus and selected state together; each selected tab has the matching visible panel. |
| Card navigation | Project cards, journal cards, and entries inside a project expose their titles as accessible link names and open using Enter. Regression tests first reproduced unnamed links in Chromium; explicit labels preserve the clickable card while naming its destination. |
| Narrow content | Long code, a wide GFM table, a project description, and a long local path do not widen the document beyond the 390 CSS-pixel viewport. Code remains horizontally scrollable inside its block. |
| Feedback | A collection error has a named alert and keyboard-reachable retry. The built home screen renders its Markdown and notification; React Query Devtools are absent. |

Validation uses `typecheck:e2e`, `lint`, `build`, the intercepted Chromium suite,
and the aggregate Vitest suite. The historical tag-assignment URL mismatch is
resolved; the client and controller use `/api/technical-entry/:id/tags`.

The standalone `TagSelector` focus check remains pending because it has no
production route and Part 7 was skipped. No test-only production route was
introduced. The separate full-stack suite now exercises real browser cookies,
account isolation, projects, journal lifecycle, and settings. See the
[setup and limitations](frontend-testing.md#full-stack-browser-journeys).
