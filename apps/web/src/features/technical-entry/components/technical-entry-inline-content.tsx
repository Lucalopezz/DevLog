import { useState } from "react";
import { Pencil } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import {
  conclusionSchema,
  contextSchema,
} from "../schemas/technical-entry.schema";
import { useUpdateTechnicalEntry } from "../hooks/use-update-technical-entry";
import type {
  TechnicalEntry,
  UpdateTechnicalEntryInput,
} from "../types/technical-entry";

type EditableField = "context" | "conclusion";

type Props = {
  entry: TechnicalEntry;
  field: EditableField;
  label: string;
  placeholder: string;
  emptyMessage: string;
  editable?: boolean;
};

/**
 * Displays one long-form technical-entry field and turns it into an editor
 * without opening another dialog.
 *
 * `value` comes from React Query through the parent entry. `draft` is local
 * state because typing should not mutate the server-backed query on every
 * keystroke. The PATCH is sent only after the user explicitly clicks Save.
 */
export function TechnicalEntryInlineContent({
  entry,
  field,
  label,
  placeholder,
  emptyMessage,
  editable = true,
}: Props) {
  const value = entry[field] ?? "";
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>();
  const updateMutation = useUpdateTechnicalEntry();

  // Read and edit modes intentionally share the same adaptive viewport rules.
  // Short content stays compact; once the larger maximum is reached, the
  // content scrolls inside the field instead of expanding the entire page.
  const contentViewportClassName =
    "min-h-24 max-h-110 overflow-y-auto rounded-lg";

  function handleStartEditing() {
    // Re-read the latest server value when editing starts. This avoids
    // presenting a stale draft after another update or a query refetch.
    setDraft(value);
    setValidationMessage(undefined);
    setIsEditing(true);
  }

  function handleCancel() {
    // Resetting here is useful even though the next edit also rehydrates the
    // draft: it makes the component immediately consistent after Cancel.
    setDraft(value);
    setValidationMessage(undefined);
    setIsEditing(false);
  }

  async function handleSave() {
    const schema = field === "context" ? contextSchema : conclusionSchema;
    const result = schema.safeParse(draft);

    // Client-side validation gives immediate feedback, but the API remains
    // the final authority because the same rules must also protect other
    // clients that may call the endpoint.
    if (!result.success) {
      setValidationMessage(result.error.issues[0]?.message ?? "Invalid value.");
      return;
    }

    const normalizedValue = draft.trim();
    const input: UpdateTechnicalEntryInput =
      field === "context"
        ? { context: normalizedValue }
        : { conclusion: normalizedValue || null };

    try {
      // The mutation hook displays errors and invalidates both detail and
      // list queries after success. Keeping this editor open on failure lets
      // the user fix the draft instead of losing it.
      await updateMutation.mutateAsync({
        technicalEntryId: entry.id,
        input,
      });
      setValidationMessage(undefined);
      setIsEditing(false);
    } catch {
      // The mutation hook already presents the server error through a toast.
      // The draft intentionally remains available for another attempt.
    }
  }

  if (isEditing && editable) {
    const errorId = `${field}-editor-error`;

    return (
      <div className="space-y-4">
        <textarea
          aria-describedby={validationMessage ? errorId : undefined}
          aria-invalid={Boolean(validationMessage)}
          aria-label={label}
          autoFocus
          className={`${contentViewportClassName} field-sizing-content w-full resize-none border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={updateMutation.isPending}
          onChange={(event) => {
            setDraft(event.target.value);
            setValidationMessage(undefined);
          }}
          placeholder={placeholder}
          value={draft}
        />

        {validationMessage ? (
          <p className="text-sm text-destructive" id={errorId} role="alert">
            {validationMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button
            disabled={updateMutation.isPending}
            onClick={handleCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={updateMutation.isPending}
            onClick={() => void handleSave()}
            type="button"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editable ? (
        <div className="flex justify-end">
          <Button
            aria-label={`Edit ${label.toLowerCase()}`}
            onClick={handleStartEditing}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
        </div>
      ) : null}

      {value.trim() ? (
        <div className={`${contentViewportClassName} pr-2`}>
          <Markdown className="max-w-3xl text-card-foreground/80">
            {value}
          </Markdown>
        </div>
      ) : (
        <div className={`${contentViewportClassName} pr-2`}>
          <p className="text-sm italic leading-6 text-muted-foreground">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
}
