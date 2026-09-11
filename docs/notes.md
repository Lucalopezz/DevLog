# Study notes: inline Markdown editing in technical entries

This note documents the current implementation of inline editing for the
technical-entry `context` and `conclusion` fields. It is intentionally focused
on the concepts that can be reused later in Projects.

The older notes described the first Projects listing slice, which is already
implemented. They were removed from this file so this document can be used as
a focused study guide instead of a history of completed work.

## What was implemented

The technical-entry detail page now has two modes for long-form content:

```text
Read mode
  Markdown content + Edit button

Edit mode
  adaptive-height textarea + Save + Cancel
```

The title remains editable through the existing dialog. The context and
conclusion are edited directly in their own sections, so the user does not
need to open a general-purpose modal to change a paragraph.

The textarea contains the original Markdown source. The source is rendered as
formatted Markdown only after the user returns to read mode.

Both modes now use the same adaptive viewport rules:
`min-h-24 max-h-110 overflow-y-auto`. Short content does not create a large
empty panel. Content grows naturally until `max-h-110` (27.5 rem), then scrolls
inside the field instead of expanding the entire page.

## Files involved

| File | Responsibility |
| --- | --- |
| `apps/web/src/features/technical-entry/components/technical-entry-inline-content.tsx` | Reusable inline editor for one long-form field |
| `apps/web/src/features/technical-entry/pages/technical-entry-detail-page.tsx` | Places the editor in the Context and Conclusion sections |
| `apps/web/src/features/technical-entry/components/technical-entry-edit-form.tsx` | Keeps the modal focused on the title |
| `apps/web/src/features/technical-entry/hooks/use-update-technical-entry.ts` | Performs the mutation, toast, and cache invalidation |
| `apps/web/src/features/technical-entry/schemas/technical-entry.schema.ts` | Shares validation rules between regular forms and inline editing |
| `apps/web/src/components/markdown.tsx` | Centralizes Markdown rendering and presentation styles |

The creation form was deliberately left unchanged. Creating an entry still
uses the shared fields component and a modal because all creation fields are
entered together.

## 1. Start with the API contract

The frontend type defines the fields accepted by the technical-entry PATCH:

```ts
export type UpdateTechnicalEntryInput = {
  title?: string;
  context?: string;
  conclusion?: string | null;
  projectId?: string | null;
};
```

This is a partial update. That gives us an important distinction:

```ts
// Replace the context, while leaving every other field untouched.
{ context: "The new context" }

// Clear the conclusion explicitly.
{ conclusion: null }

// Do not change the conclusion at all.
{}
```

The inline editor sends only the field currently being edited. This reduces
the chance of overwriting a value that was changed elsewhere after the page
was loaded.

The HTTP function remains small and transport-focused:

```ts
export async function updateTechnicalEntry(
  technicalEntryId: string,
  input: UpdateTechnicalEntryInput,
): Promise<TechnicalEntry> {
  const { data } = await api.patch<TechnicalEntry>(
    `/technical-entry/${technicalEntryId}`,
    input,
  );

  return data;
}
```

The component does not call Axios directly. Keeping HTTP code in `api/`
prevents UI components from becoming responsible for transport details.

## 2. Reuse Zod validation

The existing context rule was exported so the inline editor can use the same
rule as the create and edit forms:

```ts
export const contextSchema = z
  .string()
  .trim()
  .min(3, "Context must be at least 3 characters long");

export const conclusionSchema = z.string();
```

Why does conclusion accept an empty string? An empty conclusion is a valid
state because a user may want to remove a previous conclusion. The submitter
converts that empty input to `null` before calling the API.

```ts
const normalizedValue = draft.trim();

const input: UpdateTechnicalEntryInput =
  field === "context"
    ? { context: normalizedValue }
    : { conclusion: normalizedValue || null };
```

The important sequence is:

```text
raw textarea text
  → Zod validation
  → trim whitespace
  → convert empty conclusion to null
  → PATCH
```

Client validation improves the experience, but it does not replace server
validation. The API must enforce the same rule for mobile clients, scripts,
or any future frontend.

## 3. Keep the title dialog and content editor separate

Before this change, the edit dialog rendered the shared component with title,
context, and conclusion. After this change, the dialog has a title-only
schema:

```ts
export const updateTechnicalEntryTitleSchema = z.object({
  title: titleSchema,
});

export type UpdateTechnicalEntryTitleFormValues = z.infer<
  typeof updateTechnicalEntryTitleSchema
>;
```

The edit hook also has a specific responsibility:

```ts
export function useTechnicalEntryTitleForm(entry: TechnicalEntry) {
  return useForm<UpdateTechnicalEntryTitleFormValues>({
    resolver: zodResolver(updateTechnicalEntryTitleSchema),
    defaultValues: {
      title: entry.title,
    },
  });
}
```

This is better than leaving the old schema in place and hiding two fields.
Hidden fields would still be validated even though the user could not edit
them. A form schema should describe the fields that the form actually owns.

The modal now sends only:

```ts
await updateMutation.mutateAsync({
  technicalEntryId: entry.id,
  input: {
    title: data.title,
  },
});
```

The shared `TechnicalEntryFormFields` component remains available for the
creation form. Shared markup is useful when the interaction is genuinely the
same; forcing different interactions into one component usually creates
confusing conditionals.

## 4. Understand the inline component

The reusable component receives an entry and the field it should edit:

```ts
type EditableField = "context" | "conclusion";

type Props = {
  entry: TechnicalEntry;
  field: EditableField;
  label: string;
  placeholder: string;
  emptyMessage: string;
};
```

This allows the same component to render both fields:

```tsx
<TechnicalEntryInlineContent
  emptyMessage="Context is required."
  entry={entry}
  field="context"
  label="Context"
  placeholder="Describe what happened, where it happened, and what you tried."
/>

<TechnicalEntryInlineContent
  emptyMessage="No conclusion has been recorded yet."
  entry={entry}
  field="conclusion"
  label="Conclusion"
  placeholder="What did you learn or how did you solve it?"
/>
```

### Remote value versus local draft

The component stores two different concepts:

```tsx
const value = entry[field] ?? "";
const [draft, setDraft] = useState(value);
const [isEditing, setIsEditing] = useState(false);
```

`value` belongs to remote state. It comes from React Query through `entry`.
`draft` belongs to temporary UI state. It changes on every keystroke but does
not call the API.

This separation makes Cancel possible:

```tsx
function handleStartEditing() {
  // Re-read the latest server value when editing starts. This avoids
  // presenting a stale draft after another update or a query refetch.
  setDraft(value);
  setValidationMessage(undefined);
  setIsEditing(true);
}

function handleCancel() {
  setDraft(value);
  setValidationMessage(undefined);
  setIsEditing(false);
}
```

Do not use an effect to overwrite `draft` every time `entry` changes while the
user is typing. A refetch during editing must not destroy the user's unsaved
text. Rehydrating only when editing starts is the safer boundary.

### Validation before mutation

The field determines which Zod schema applies:

```tsx
async function handleSave() {
  const schema = field === "context" ? contextSchema : conclusionSchema;
  const result = schema.safeParse(draft);

  // Client-side validation gives immediate feedback, but the API remains
  // the final authority for data integrity.
  if (!result.success) {
    setValidationMessage(result.error.issues[0]?.message ?? "Invalid value.");
    return;
  }

  const normalizedValue = draft.trim();
  // Build a partial payload so saving one field cannot overwrite the other.
  const input: UpdateTechnicalEntryInput =
    field === "context"
      ? { context: normalizedValue }
      : { conclusion: normalizedValue || null };

  // The mutation hook owns the request and query invalidation.
  await updateMutation.mutateAsync({
    technicalEntryId: entry.id,
    input,
  });
}
```

`safeParse` is useful here because the component wants to display an error
without throwing an exception. The result has an explicit success/failure
branch that is easy to follow while learning.

### The adaptive-height textarea

The editor uses a native `textarea`, which is already enough for raw Markdown:

```tsx
<textarea
  aria-label={label}
  autoFocus
  className="min-h-24 max-h-110 field-sizing-content w-full resize-none overflow-y-auto rounded-lg border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
  disabled={updateMutation.isPending}
  onChange={(event) => {
    setDraft(event.target.value);
    setValidationMessage(undefined);
  }}
  placeholder={placeholder}
  value={draft}
/>
```

The relevant Tailwind utilities are:

| Class | Effect |
| --- | --- |
| `min-h-24` | Gives short content a comfortable minimum editing area |
| `max-h-110` | Prevents long content from growing beyond 27.5 rem |
| `field-sizing-content` | Lets the textarea grow naturally with its content |
| `overflow-y-auto` | Adds an internal vertical scrollbar for long content |
| `resize-none` | Keeps the layout stable instead of allowing manual resizing |
| `autoFocus` | Places the cursor in the editor when editing starts |

Using only a fixed height would make a one-line value occupy the same space as
a long document. `field-sizing-content` lets the textarea follow the content
until the maximum height is reached. At that point, the browser keeps the
textarea at the maximum and `overflow-y-auto` exposes the remaining content.

The `field-sizing-content` utility uses the CSS `field-sizing: content`
property. This is preferable here to manually measuring `scrollHeight` in a
React effect: it avoids synchronization code, layout reads, and hardcoded
pixel calculations.

The read mode uses the same viewport classes:

```tsx
<div className={`${contentViewportClassName} pr-2`}>
  <Markdown className="max-w-3xl text-card-foreground/80">
    {value}
  </Markdown>
</div>
```

The class is shared inside the component:

```tsx
const contentViewportClassName =
  "min-h-24 max-h-110 overflow-y-auto rounded-lg";
```

Keeping the class in one place is important. If the textarea and Markdown view
used different minimum or maximum sizes, changing modes would cause a visible
layout shift and the user would see a different amount of content.

## 5. Render Markdown only in read mode

The shared renderer is used after editing ends:

```tsx
{value.trim() ? (
  <Markdown className="max-w-3xl text-card-foreground/80">
    {value}
  </Markdown>
) : (
  <p className="text-sm italic leading-6 text-muted-foreground">
    {emptyMessage}
  </p>
)}
```

The shared component uses `react-markdown` and `remark-gfm`:

```tsx
export function Markdown({ className, ...props }: MarkdownProps) {
  return (
    <div
      className={cn(
        "space-y-3 break-words text-sm leading-6 [&_a]:break-words [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_del]:line-through [&_em]:italic [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:border-border [&_input]:mr-2 [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-7 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-semibold [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      {/* Keep GFM enabled after spreading props so callers cannot accidentally
          replace the plugin and lose tables, task lists, or strikethrough. */}
      <ReactMarkdown {...props} remarkPlugins={[remarkGfm]} />
    </div>
  );
}
```

The wrapper centralizes typography and list styles. Without it, every feature
would need to repeat the same Markdown configuration and Tailwind selectors.

Do not add `rehype-raw` casually. Raw HTML support creates a larger security
surface. If the product later needs raw HTML, study sanitization first and
make that decision explicit.

### Markdown troubleshooting

`react-markdown` creates semantic HTML elements such as `h2`, `ul`, `table`,
and `pre`; it does not provide a complete visual theme. Tailwind's base reset
also removes several browser defaults, so Markdown can technically parse
correctly while headings and lists appear visually like plain text.

The shared renderer therefore styles the elements explicitly:

```text
Markdown source
  → react-markdown parses syntax
  → remark-gfm adds tables, task lists, and strikethrough
  → semantic HTML elements are created
  → Tailwind selectors restore readable typography and spacing
```

Examples of the supported syntax:

```md
## Heading

**Important** and *emphasized* text.

- Unordered item
- Another item

1. Ordered item
2. Another item

> A useful observation.

| Tool | Purpose |
| --- | --- |
| React Query | Server state |

- [ ] Pending task
- [x] Completed task
```

When Markdown appears as raw characters, first verify that the value is passed
as a string child to `<Markdown>{value}</Markdown>` rather than escaped into a
different field. When it parses but looks unstyled, check the renderer's
element selectors before adding another Markdown library. When tables or task
lists do not parse, verify that `remarkGfm` is still present.

## 6. Mutation and cache invalidation

The inline component reuses `useUpdateTechnicalEntry` instead of creating a
second mutation implementation:

```tsx
const updateMutation = useUpdateTechnicalEntry();
```

The hook has three important responsibilities:

```text
mutationFn
  → calls PATCH

onSuccess
  → shows success toast
  → invalidates detail query
  → invalidates technical-entry list queries

onError
  → converts API error to a user-facing toast
```

After a successful save, React Query asks for fresh data. The server remains
the source of truth instead of manually editing multiple cached objects.

The component closes edit mode only after `mutateAsync` resolves:

```tsx
try {
  await updateMutation.mutateAsync({
    technicalEntryId: entry.id,
    input,
  });
  setValidationMessage(undefined);
  setIsEditing(false);
} catch {
  // Keep the draft and editor open so the user can try again.
}
```

Closing before the request finishes would make a failed save look successful
and could discard the user's draft.

## 7. Asynchronous and validation states

The component intentionally handles each state:

| State | Interface behavior |
| --- | --- |
| Read mode | Shows Markdown and an Edit button |
| Editing | Shows raw Markdown in a textarea |
| Validation error | Keeps the editor open and shows the message below the textarea |
| Saving | Disables textarea and buttons; button says `Saving...` |
| Successful save | Returns to Markdown mode after the mutation resolves |
| Server error | Keeps the draft; the mutation hook shows an error toast |
| Cancel | Discards the local draft and returns to read mode |

The input also exposes validation state to assistive technology:

```tsx
<textarea
  aria-describedby={validationMessage ? errorId : undefined}
  aria-invalid={Boolean(validationMessage)}
  aria-label={label}
/>

{validationMessage ? (
  <p id={errorId} role="alert">
    {validationMessage}
  </p>
) : null}
```

The `aria-describedby` relationship tells a screen reader where the error
message is. `aria-invalid` communicates that the current value is not valid.

## 8. Data-flow diagram

```text
TechnicalEntryDetailPage
  ├─ entry from useGetTechnicalEntry()
  ├─ TechnicalEntryInlineContent(field="context")
  │    ├─ displays Markdown
  │    ├─ owns draft state
  │    ├─ validates with contextSchema
  │    └─ calls useUpdateTechnicalEntry()
  └─ TechnicalEntryInlineContent(field="conclusion")
       ├─ displays Markdown or empty state
       ├─ owns draft state
       ├─ validates with conclusionSchema
       └─ calls useUpdateTechnicalEntry()

useUpdateTechnicalEntry()
  → updateTechnicalEntry()
  → PATCH /technical-entry/:id
  → invalidate detail and list queries
  → page receives fresh TechnicalEntry
```

This is a useful frontend architecture pattern:

```text
Page       = composition
Component  = interaction and local UI state
Hook       = server mutation and async state
API        = HTTP transport
Schema     = client-side validation
Markdown   = read-only presentation
```

## 9. How to reproduce this pattern in Projects

Suppose Projects later gets an editable Markdown description. Follow this
sequence instead of copying the technical-entry component blindly.

### Step 1 — confirm the backend contract

Find the project update DTO and determine whether the API expects:

```ts
{ description: string }
```

or:

```ts
{ description: string | null }
```

Do not guess what an empty string means. A PATCH contract must distinguish:

```text
field omitted = preserve current value
field set to null = clear current value
field set to string = replace current value
```

### Step 2 — create a field-specific schema

For example:

```ts
export const projectDescriptionSchema = z.string();

export const updateProjectDescriptionSchema = z.object({
  description: projectDescriptionSchema,
});
```

If the description is required, use a minimum length. If it is nullable,
allow an empty draft and convert it to `null` in the submitter.

### Step 3 — reuse the existing project mutation

Do not create a second Axios call inside the new component. Use the project
mutation hook so success toasts, error handling, and cache invalidation remain
centralized.

```tsx
await updateProjectMutation.mutateAsync({
  projectId: project.id,
  input: { description: normalizedValue || null },
});
```

### Step 4 — create a small inline component

The reusable shape is:

```tsx
function ProjectInlineDescription({ project }: Props) {
  const [draft, setDraft] = useState(project.description ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateProject();

  function startEditing() {
    setDraft(project.description ?? "");
    setIsEditing(true);
  }

  async function save() {
    const normalizedValue = draft.trim();

    await updateMutation.mutateAsync({
      projectId: project.id,
      input: { description: normalizedValue || null },
    });

    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <textarea
          className="min-h-24 max-h-110 field-sizing-content w-full resize-none overflow-y-auto"
          disabled={updateMutation.isPending}
          onChange={(event) => setDraft(event.target.value)}
          value={draft}
        />
        <Button disabled={updateMutation.isPending} onClick={save}>
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button onClick={startEditing} type="button" variant="ghost">
        Edit
      </Button>
      <Markdown>{project.description ?? "No description yet."}</Markdown>
    </div>
  );
}
```

This is a learning example, not a replacement for the production component.
The production version should also include Cancel, validation messages,
accessibility attributes, and error handling as shown above.

### Step 5 — decide where Markdown should render

The current technical-entry change applies to the detail page. The list cards
still show a short plain-text preview because they use truncation such as
`line-clamp-4`. Rendering a complete Markdown document inside a small card can
make the card height and preview behavior unpredictable.

For Projects, decide separately whether Markdown belongs in:

- the detail page only;
- list previews as a simplified excerpt;
- project cards and dashboard summaries.

Do not automatically render the full document in every surface. Reading
context determines the appropriate presentation.

## 10. Testing checklist

### Manual behavior

- Open a technical-entry detail page.
- Confirm context and conclusion show an Edit button.
- Click Edit and confirm the textarea receives focus.
- Enter Markdown such as headings, lists, links, and code blocks.
- Confirm short content stays compact and long content scrolls after the
  maximum height is reached.
- Click Cancel and confirm the original content returns.
- Save valid context and confirm Markdown renders afterward.
- Clear the conclusion and confirm it can be saved.
- Force a server error and confirm the draft remains visible.

### Accessibility

- Focus the Edit, Save, and Cancel buttons using the keyboard.
- Confirm the textarea has a meaningful accessible label.
- Confirm validation errors are announced through `role="alert"`.
- Confirm disabled controls communicate the saving state.

### Validation commands

```bash
pnpm --filter web lint
pnpm --filter web build
git diff --check
```

## Topics worth studying next

- Local state versus server state;
- React Query query keys and invalidation;
- Partial PATCH semantics;
- `useMutation` lifecycle callbacks;
- Zod `safeParse` versus throwing validation;
- React Hook Form resolvers;
- Accessible error relationships with `aria-describedby`;
- Markdown parsing and the security implications of raw HTML;
- When to use inline editing versus a dialog;
- How to keep list previews different from detail presentations.
