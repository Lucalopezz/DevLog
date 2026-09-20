# Frontend roadmap — DevLog

Scope: React screens, navigation, forms, client-side validation, API
integration, and frontend user experience. API behavior and domain rules are
documented separately in [`../usecases/`](../usecases/).

> [!NOTE]
> The frontend scope for MVP 1.0 is complete. This roadmap records the
> implemented project and technical-entry workflows, then lists the product
> areas that remain for a later release.

## MVP 1.0 — complete

### Projects and project knowledge

- [x] List, search, filter, create, edit, archive, restore, and delete projects.
- [x] Show project overview data, status, technologies, and aggregate counts.
- [x] Browse a project's paginated technical entries, commands, and resources.
- [x] Create, edit, and delete project commands and resources.
- [x] Add and remove technologies from a project.
- [x] Keep archived projects read-only and protect permanent deletion with a
  confirmation flow.

### Technical journal and issue resolution

- [x] Create and browse paginated active and archived entries.
- [x] Filter the active journal by title, type, issue status, and tag.
- [x] View entry details and render Markdown content.
- [x] Edit an entry's title, context, and conclusion.
- [x] Assign and remove tags from an entry; manage the user's tags separately.
- [x] Record, edit, and remove solution attempts for issues.
- [x] Resolve an issue with a conclusion and reopen a resolved issue while
  preserving its history.
- [x] Archive, restore, and permanently delete entries with confirmation where
  appropriate.
- [x] Open Quick Capture from the sidebar to create a regular technical entry
  through the existing entry form and API flow.

### Application foundation

- [x] Provide registration, login, logout, authenticated navigation, and a
  read-only account page.
- [x] Provide frontend unit/component tests with Vitest and browser test
  commands with Playwright.
- [x] Represent loading, empty, and error states across the main list and detail
  flows.

Quick Capture is a shortcut into the regular entry creation flow, not a draft
or a separate domain entity. The existing backend use cases remain the source
of truth for API validation and lifecycle rules.

## Planned after MVP 1.0

- [ ] **Account data management:** add frontend flows to update the profile name
  and change the password using the existing API. The email remains read-only
  under the current API contract.
- [ ] **Environments:** add a page to list project environments or stacks, such
  as Next.js running on Ubuntu. The source and shape of this data still need to
  be defined.
- [ ] **Activity Timeline:** add a chronological view of project and journal
  activity.
- [ ] **Knowledge Overview:** add a summary view for the technical knowledge
  recorded across projects and entries.

The roadmap keeps these follow-up features separate from MVP 1.0 so the shipped
project and journal workflows stay easy to identify. Environment data modeling
and the precise scope of the two overview pages should be decided when those
features are designed.
