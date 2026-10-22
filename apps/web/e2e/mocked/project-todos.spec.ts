import { expect, test } from "@playwright/test";
import { authenticatedApi, mockApi, projectId } from "./mock-api";

test("opens project to-dos by keyboard and keeps controls reachable on a narrow screen", async ({
  page,
}) => {
  const todo = {
    id: "44444444-4444-4444-8444-444444444444",
    projectId,
    title: "Review the release checklist",
    completedAt: null,
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-09-14T10:00:00.000Z",
  };
  const assertNoUnexpected = await mockApi(page, (request, url) => {
    if (
      url.pathname === `/api/project/${projectId}/todos` &&
      request.method() === "GET"
    ) {
      return {
        body: {
          data: [todo],
          meta: { currentPage: 1, perPage: 20, lastPage: 1, total: 1 },
        },
      };
    }
    return authenticatedApi(request, url);
  });

  await page.goto(`/projects/${projectId}`);
  const entriesTab = page.getByRole("tab", { name: "Technical entries" });
  await entriesTab.focus();
  await page.keyboard.press("ArrowRight");
  const todosTab = page.getByRole("tab", { name: "To-dos" });
  await expect(todosTab).toBeFocused();
  await expect(todosTab).toHaveAttribute("aria-selected", "true");
  const panel = page.getByRole("tabpanel", { name: "To-dos" });
  await expect(panel.getByText(todo.title)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(panel.getByRole("textbox", { name: "New to-do" })).toBeVisible();
  await expect(
    panel.getByRole("button", { name: `Delete ${todo.title}` }),
  ).toBeVisible();
  assertNoUnexpected();
});
