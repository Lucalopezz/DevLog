# Frontend backlog — DevLog

Scope: React screens, navigation, forms, client-side validation, API
integration, loading states, and frontend user experience.

This backlog complements [`backlog/backend.md`](backend.md). A frontend task
may consume an existing API capability without requiring a backend change.

## 1. Technical journal

- [ ] Create the `/entries` page with pagination and entry cards.
- [ ] Add filters for title, project, type, tag, and issue status.
- [ ] Create the `/entries/:entryId` detail page.
- [ ] Add technical entry creation and editing forms.
- [ ] Add tags to the entry form and tag relationship actions.
- [ ] Add solution attempt creation, editing, and removal for `ISSUE` entries.
- [ ] Add resolve and reopen actions for technical issues.
- [ ] Add archive and delete actions with confirmation flows.

## 2. Quick Capture

### Product intent

`Quick Capture` is a fast way to register a technical observation while the
context is still fresh. It is a simplified entry-creation experience, not a
new type of entry and not a separate domain entity.

The first version should create a normal `TechnicalEntry` immediately. It is
not a draft or an inbox. The user can later open the complete entry and add
tags, a conclusion, solution attempts, or resolution details.

### Proposed first version

The sidebar item opens a small modal or drawer containing only the information
needed to create a valid entry:

- `Title` — required;
- `Type` — `ISSUE` or `LEARNING`, required;
- `Context` — required;
- `Project` — optional.

The form should use the same frontend conventions as the other forms:

1. React Hook Form owns the form state and submission lifecycle.
2. A Zod schema validates the client-side shape before the request.
3. The API client sends `POST /api/technical-entry` with the authenticated
   session cookie.
4. On success, the modal closes, a success notification is shown, and the
   relevant entry queries are invalidated.
5. The created entry may then be opened in the full detail screen once that
   route exists.

The UI must represent loading, validation errors, API errors, and successful
creation. The primary action should make it clear that the capture is saved
immediately.

### Backend impact

The first version does not require a new backend endpoint, database column,
entity, or use case. It reuses the existing `CreateTechnicalEntry` flow and
its validation rules. The current API already accepts the proposed fields in
`CreateTechnicalEntryDto`; `userId` continues to come from the authenticated
request rather than from the browser.

This keeps Quick Capture as a presentation-level shortcut. A dedicated
`POST /api/technical-entry/quick-capture` endpoint would duplicate the normal
creation contract without adding domain behavior.

### Future draft support

If the product later needs captures with missing required fields, Quick
Capture must evolve into an explicit draft concept. Possible designs include a
`DRAFT` lifecycle status on `TechnicalEntry` or a separate inbox entity. That
decision would affect domain validation, list queries, API contracts, and
database migrations, so it should not be introduced as part of the first
version.

### Acceptance criteria

- [ ] The authenticated user can open Quick Capture from the sidebar.
- [ ] The form prevents submission when required fields are invalid.
- [ ] A valid submission creates a regular technical entry through the
  existing API.
- [ ] The user receives visible feedback while saving and after success or
  failure.
- [ ] The new entry becomes available to the journal list without a manual
  page refresh.
- [ ] The flow works in the mobile sidebar drawer as well as desktop.

## 3. Project knowledge

- [ ] Connect project technical entries to the journal experience.
- [ ] Connect technologies, commands, links, and resources to project detail
  views.
- [ ] Add tag management surfaces when the product needs a dedicated tag
  workflow.
- [ ] Design documentation-only environment and service views.

## 4. Shared frontend experience

- [ ] Replace placeholder sidebar items with routes as each feature becomes
  available.
- [ ] Add empty, loading, error, and archived states consistently across
  feature pages.
- [ ] Add a frontend test runner and behavior tests for forms and navigation.
- [ ] Add the planned Settings and Help & feedback surfaces.

