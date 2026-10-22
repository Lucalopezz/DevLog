import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { createProjectFixture } from "@/test/factories/project";
import { deferred } from "@/test/deferred";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";
import ProjectDetailPage from "../pages/project-detail-page";

const project = createProjectFixture();
const todo = {
  id: "todo-1",
  projectId: project.id,
  title: "Write release notes",
  completedAt: null as string | null,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
};

function setup(archived = false) {
  let todos = [todo];
  const requests: Array<{ method: string; body?: unknown }> = [];
  server.use(
    http.get(apiUrl("/tag"), () =>
      HttpResponse.json({
        data: [],
        meta: { currentPage: 1, perPage: 100, lastPage: 1, total: 0 },
      }),
    ),
    http.get(apiUrl(`/project/${project.id}`), () =>
      HttpResponse.json({
        ...project,
        archivedAt: archived ? project.updatedAt : undefined,
      }),
    ),
    http.get(apiUrl(`/project/${project.id}/technical-entries`), () =>
      HttpResponse.json({
        data: [],
        meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 0 },
      }),
    ),
    http.get(apiUrl(`/project/${project.id}/commands`), () =>
      HttpResponse.json({
        data: [],
        meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 0 },
      }),
    ),
    http.get(apiUrl(`/project/${project.id}/resources`), () =>
      HttpResponse.json({
        data: [],
        meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 0 },
      }),
    ),
    http.get(apiUrl(`/project/${project.id}/todos`), () =>
      HttpResponse.json({
        data: todos,
        meta: { currentPage: 1, perPage: 20, lastPage: 1, total: todos.length },
      }),
    ),
    http.post(apiUrl(`/project/${project.id}/todos`), async ({ request }) => {
      const body = (await request.json()) as { title: string };
      requests.push({ method: "POST", body });
      const created = { ...todo, id: "todo-2", title: body.title };
      todos = [...todos, created];
      return HttpResponse.json(created, { status: 201 });
    }),
    http.patch(
      apiUrl(`/project/${project.id}/todos/:todoId`),
      async ({ request, params }) => {
        const body = (await request.json()) as {
          title?: string;
          completed?: boolean;
        };
        requests.push({ method: "PATCH", body });
        todos = todos.map((item) =>
          item.id === params.todoId
            ? {
                ...item,
                title: body.title ?? item.title,
                completedAt:
                  body.completed === undefined
                    ? item.completedAt
                    : body.completed
                      ? project.updatedAt
                      : null,
              }
            : item,
        );
        return HttpResponse.json(
          todos.find((item) => item.id === params.todoId),
        );
      },
    ),
    http.delete(
      apiUrl(`/project/${project.id}/todos/:todoId`),
      ({ params }) => {
        requests.push({ method: "DELETE" });
        todos = todos.filter((item) => item.id !== params.todoId);
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  const result = renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
    </Routes>,
    { route: `/projects/${project.id}` },
  );
  return { ...result, requests };
}

describe("project to-dos tab", () => {
  it("creates, completes, edits, and deletes a to-do through the project API", async () => {
    const { user, requests } = setup();
    await user.click(await screen.findByRole("tab", { name: "To-dos" }));
    const panel = await screen.findByRole("tabpanel", { name: "To-dos" });
    expect(await within(panel).findByText(todo.title)).toBeVisible();
    await user.type(
      within(panel).getByRole("textbox", { name: "New to-do" }),
      "  Check deployment  ",
    );
    await user.click(within(panel).getByRole("button", { name: "Add to-do" }));
    expect(await within(panel).findByText("Check deployment")).toBeVisible();
    expect(requests).toContainEqual({
      method: "POST",
      body: { title: "Check deployment" },
    });
    await user.click(
      within(panel).getByRole("checkbox", { name: `Complete ${todo.title}` }),
    );
    await waitFor(() =>
      expect(requests).toContainEqual({
        method: "PATCH",
        body: { completed: true },
      }),
    );
    await user.click(
      within(panel).getByRole("button", { name: `Edit ${todo.title}` }),
    );
    const editInput = within(panel).getByRole("textbox", {
      name: "Edit to-do",
    });
    await user.clear(editInput);
    await user.type(editInput, "Publish release notes");
    await user.click(within(panel).getByRole("button", { name: "Save to-do" }));
    expect(
      await within(panel).findByText("Publish release notes"),
    ).toBeVisible();
    await user.click(
      within(panel).getByRole("button", {
        name: "Delete Publish release notes",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Delete to-do" }));
    await waitFor(() =>
      expect(within(panel).queryByText("Publish release notes")).toBeNull(),
    );
    expect(requests.some((request) => request.method === "DELETE")).toBe(true);
  });

  it("keeps an archived project's to-dos readable but disables changes", async () => {
    const { user } = setup(true);
    await user.click(await screen.findByRole("tab", { name: "To-dos" }));
    const panel = await screen.findByRole("tabpanel", { name: "To-dos" });
    expect(await within(panel).findByText(todo.title)).toBeVisible();
    expect(
      within(panel).getByRole("textbox", { name: "New to-do" }),
    ).toBeDisabled();
    expect(
      within(panel).getByRole("checkbox", { name: `Complete ${todo.title}` }),
    ).toBeDisabled();
    expect(
      within(panel).getByRole("button", { name: `Edit ${todo.title}` }),
    ).toBeDisabled();
    expect(
      within(panel).getByRole("button", { name: `Delete ${todo.title}` }),
    ).toBeDisabled();
  });

  it("shows loading, an API error, retry, and keeps a failed create draft", async () => {
    const { user } = setup();
    const gate = deferred<void>();
    let reads = 0;
    server.use(
      http.get(apiUrl(`/project/${project.id}/todos`), async () => {
        reads += 1;
        if (reads === 1) {
          await gate.promise;
          return HttpResponse.json({ message: "Offline" }, { status: 500 });
        }
        return HttpResponse.json({
          data: [],
          meta: { currentPage: 1, perPage: 20, lastPage: 1, total: 0 },
        });
      }),
      http.post(apiUrl(`/project/${project.id}/todos`), () =>
        HttpResponse.json({ message: "Save failed" }, { status: 500 }),
      ),
    );
    await user.click(await screen.findByRole("tab", { name: "To-dos" }));
    const panel = await screen.findByRole("tabpanel", { name: "To-dos" });
    expect(within(panel).getByText("Loading content...")).toBeVisible();
    gate.resolve(undefined);
    expect(
      await within(panel).findByText("Could not load this section."),
    ).toBeVisible();
    await user.click(within(panel).getByRole("button", { name: "Try again" }));
    expect(
      await within(panel).findByText("No to-dos have been added yet."),
    ).toBeVisible();
    const input = within(panel).getByRole("textbox", { name: "New to-do" });
    await user.type(input, "Keep this draft");
    await user.click(within(panel).getByRole("button", { name: "Add to-do" }));
    await waitFor(() =>
      expect(
        within(panel).getByRole("button", { name: "Add to-do" }),
      ).toBeEnabled(),
    );
    expect(input).toHaveValue("Keep this draft");
  });

  it("returns to the previous page after deleting its only to-do", async () => {
    const { user } = setup();
    let deleted = false;
    server.use(
      http.get(apiUrl(`/project/${project.id}/todos`), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page"));
        return HttpResponse.json({
          data:
            page === 1
              ? [{ ...todo, id: "first-page", title: "First page task" }]
              : deleted
                ? []
                : [todo],
          meta: {
            currentPage: page,
            perPage: 20,
            lastPage: deleted ? 1 : 2,
            total: deleted ? 20 : 21,
          },
        });
      }),
      http.delete(apiUrl(`/project/${project.id}/todos/${todo.id}`), () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await user.click(await screen.findByRole("tab", { name: "To-dos" }));
    const panel = await screen.findByRole("tabpanel", { name: "To-dos" });
    await user.click(
      await within(panel).findByRole("button", { name: "Next" }),
    );
    expect(await within(panel).findByText(todo.title)).toBeVisible();
    await user.click(
      within(panel).getByRole("button", { name: `Delete ${todo.title}` }),
    );
    await user.click(screen.getByRole("button", { name: "Delete to-do" }));
    expect(await within(panel).findByText("First page task")).toBeVisible();
    expect(within(panel).queryByRole("button", { name: "Next" })).toBeNull();
  });
});
