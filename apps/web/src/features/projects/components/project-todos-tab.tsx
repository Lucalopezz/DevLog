import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/ui/form-input";
import {
  DetailPagination,
  EmptySection,
  LoadingSection,
  SectionError,
} from "./project-detail-section-ui";
import { ProjectDetailSectionFrame } from "./project-detail-section-frame";
import type { ProjectTodo } from "../api/project-todos";
import {
  useCreateProjectTodo,
  useDeleteProjectTodo,
  useProjectTodos,
  useUpdateProjectTodo,
} from "../hooks/use-project-todos";

const titleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title must be at most 200 characters long."),
});
type TitleValues = z.infer<typeof titleSchema>;

function TodoRow({
  todo,
  isArchived,
  isOnlyItemOnPage,
  onDeleted,
}: {
  todo: ProjectTodo;
  isArchived: boolean;
  isOnlyItemOnPage: boolean;
  onDeleted: (wasOnlyItemOnPage: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const update = useUpdateProjectTodo();
  const remove = useDeleteProjectTodo();
  const form = useForm<TitleValues>({
    resolver: zodResolver(titleSchema),
    defaultValues: { title: todo.title },
  });

  async function save(values: TitleValues) {
    try {
      await update.mutateAsync({
        projectId: todo.projectId,
        todoId: todo.id,
        input: { title: values.title },
      });
      setEditing(false);
    } catch {
      // Keep the editable draft after an API failure; the mutation reports it.
    }
  }

  async function confirmDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    // Remember the page before invalidation replaces its data. A successful
    // deletion may make the current page disappear from the next response.
    const wasOnlyItemOnPage = isOnlyItemOnPage;
    try {
      await remove.mutateAsync({ projectId: todo.projectId, todoId: todo.id });
      setDeleteOpen(false);
      onDeleted(wasOnlyItemOnPage);
    } catch {
      // Leave confirmation open for a retry.
    }
  }

  return (
    <li className="flex flex-wrap items-start gap-3 rounded-xl border border-border/60 bg-card/80 p-4 sm:flex-nowrap">
      <input
        aria-label={`${todo.completedAt ? "Reopen" : "Complete"} ${todo.title}`}
        checked={Boolean(todo.completedAt)}
        className="mt-1 size-4 shrink-0 accent-primary"
        disabled={isArchived || update.isPending || remove.isPending}
        onChange={() =>
          update.mutate({
            projectId: todo.projectId,
            todoId: todo.id,
            input: { completed: !todo.completedAt },
          })
        }
        type="checkbox"
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <Form {...form}>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={form.handleSubmit(save)}
            >
              <div className="min-w-48 flex-1">
                <FormInput
                  control={form.control}
                  disabled={update.isPending}
                  label="Edit to-do"
                  maxLength={200}
                  name="title"
                />
              </div>
              <Button disabled={update.isPending} size="sm" type="submit">
                Save to-do
              </Button>
              <Button
                disabled={update.isPending}
                onClick={() => {
                  form.reset({ title: todo.title });
                  setEditing(false);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </form>
          </Form>
        ) : (
          <span
            className={`break-words ${todo.completedAt ? "text-muted-foreground line-through" : ""}`}
          >
            {todo.title}
          </span>
        )}
      </div>
      {!editing ? (
        <div className="flex shrink-0 gap-2">
          <Button
            aria-label={`Edit ${todo.title}`}
            disabled={isArchived || update.isPending || remove.isPending}
            onClick={() => {
              form.reset({ title: todo.title });
              setEditing(true);
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Edit
          </Button>
          <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
            <AlertDialogTrigger asChild>
              <Button
                aria-label={`Delete ${todo.title}`}
                disabled={isArchived || update.isPending || remove.isPending}
                size="sm"
                type="button"
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-destructive/10 text-destructive">
                  <AlertTriangle />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete this to-do?</AlertDialogTitle>
                <AlertDialogDescription>
                  “{todo.title}” will be permanently removed from this project.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={remove.isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={remove.isPending}
                  onClick={confirmDelete}
                  variant="destructive"
                >
                  {remove.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : null}
                  Delete to-do
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}
    </li>
  );
}

export function ProjectTodosTab({
  projectId,
  isArchived,
}: {
  projectId: string;
  isArchived: boolean;
}) {
  const [page, setPage] = useState(1);
  const query = useProjectTodos(projectId, page);
  const create = useCreateProjectTodo();
  const form = useForm<TitleValues>({
    resolver: zodResolver(titleSchema),
    defaultValues: { title: "" },
  });

  async function add(values: TitleValues) {
    try {
      await create.mutateAsync({ projectId, title: values.title });
      form.reset();
      setPage(1);
    } catch {
      // A failed write leaves the title available for correction or retry.
    }
  }

  return (
    <ProjectDetailSectionFrame
      description="Tasks to finish for this project."
      title="To-dos"
    >
      {isArchived ? (
        <p className="text-sm text-muted-foreground">
          This project is archived. To-dos are read-only until it is restored.
        </p>
      ) : null}
      <Form {...form}>
        <form
          className="flex flex-col items-start gap-3 sm:flex-row sm:items-end"
          onSubmit={form.handleSubmit(add)}
        >
          <div className="w-full flex-1">
            <FormInput
              control={form.control}
              disabled={isArchived || create.isPending}
              label="New to-do"
              maxLength={200}
              name="title"
            />
          </div>
          <Button disabled={isArchived || create.isPending} type="submit">
            {create.isPending ? <Loader2 className="animate-spin" /> : null}Add
            to-do
          </Button>
        </form>
      </Form>
      {query.isFetching && !query.isPending ? (
        <p
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <RefreshCw className="size-4 animate-spin" />
          Updating to-dos...
        </p>
      ) : null}
      {query.isPending ? (
        <LoadingSection />
      ) : query.isError ? (
        <SectionError onRetry={() => query.refetch()} />
      ) : query.data?.data.length ? (
        <div className="space-y-4">
          <ul className="space-y-3">
            {query.data.data.map((todo) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                isArchived={isArchived}
                isOnlyItemOnPage={query.data.data.length === 1}
                onDeleted={(wasOnlyItemOnPage) => {
                  if (wasOnlyItemOnPage && page > 1) {
                    setPage(page - 1);
                  }
                }}
              />
            ))}
          </ul>
          <DetailPagination
            isFetching={query.isFetching}
            meta={query.data.meta}
            onPageChange={setPage}
          />
        </div>
      ) : (
        <EmptySection>No to-dos have been added yet.</EmptySection>
      )}
    </ProjectDetailSectionFrame>
  );
}
