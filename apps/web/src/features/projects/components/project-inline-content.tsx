import { useState } from "react";
import { Pencil } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import type { Project, UpdateProjectInput } from "../types/project";
import { useUpdateProject } from "../hooks/use-update-project";
import { descriptionSchema } from "../schemas/project.schema";

export function ProjectInlineContent({ project }: { project: Project }) {
  const description = project.description ?? "";
  const [draft, setDraft] = useState(description);
  const [isEditing, setIsEditing] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>();
  const updateMutation = useUpdateProject();

  // Read and edit modes intentionally share the same adaptive viewport rules.
  // Short content stays compact; once the larger maximum is reached, the
  // content scrolls inside the field instead of expanding the entire page.
  const contentViewportClassName =
    "min-h-14 max-h-90 overflow-y-auto rounded-lg";

  function handleStartEditing() {
    // Re-read the latest server value when editing starts. This avoids
    // presenting a stale draft after another update or a query refetch.
    setDraft(description);
    setValidationMessage(undefined);
    setIsEditing(true);
  }

  function handleCancel() {
    // Resetting here is useful even though the next edit also rehydrates the
    // draft: it makes the component immediately consistent after Cancel.
    setDraft(description);
    setValidationMessage(undefined);
    setIsEditing(false);
  }

  async function handleSave() {
    const schema = descriptionSchema;
    const result = schema.safeParse(draft);

    // Client-side validation gives immediate feedback, but the API remains
    // the final authority because the same rules must also protect other
    // clients that may call the endpoint.
    if (!result.success) {
      setValidationMessage(result.error.issues[0]?.message ?? "Invalid value.");
      return;
    }

    const normalizedValue = draft.trim();
    const input: UpdateProjectInput = { description: normalizedValue || null };

    try {
      // The mutation hook displays errors and invalidates both detail and
      // list queries after success. Keeping this editor open on failure lets
      // the user fix the draft instead of losing it.
      await updateMutation.mutateAsync({
        projectId: project.id,
        input,
      });
      setValidationMessage(undefined);
      setIsEditing(false);
    } catch {
      // The mutation hook already presents the server error through a toast.
      // The draft intentionally remains available for another attempt.
    }
  }

  if (isEditing) {
    const errorId = "description-editor-error";

    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <textarea
          aria-describedby={validationMessage ? errorId : undefined}
          aria-invalid={Boolean(validationMessage)}
          aria-label="Project description"
          autoFocus
          className={`${contentViewportClassName} field-sizing-content w-full resize-none border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={updateMutation.isPending}
          onChange={(event) => {
            setDraft(event.target.value);
            setValidationMessage(undefined);
          }}
          placeholder="Describe the project and its purpose."
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
          <Button disabled={updateMutation.isPending} type="submit">
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          aria-label="Edit project description"
          onClick={handleStartEditing}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Pencil data-icon="inline-start" />
          Edit
        </Button>
      </div>

      {description.trim() ? (
        <div className={`${contentViewportClassName} pr-2`}>
          <Markdown className="max-w-3xl text-card-foreground/80">
            {description}
          </Markdown>
        </div>
      ) : (
        <div className={`${contentViewportClassName} pr-2`}>
          <p className="text-sm italic leading-6 text-muted-foreground">
            No project description has been recorded yet.
          </p>
        </div>
      )}
    </div>
  );
}
