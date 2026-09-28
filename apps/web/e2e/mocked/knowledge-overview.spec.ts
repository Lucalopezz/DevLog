import { expect, test } from "@playwright/test";
import {
  authenticatedApi,
  entry,
  mockApi,
  project,
  projectId,
} from "./mock-api";

test.use({ timezoneId: "America/Sao_Paulo" });

for (const viewport of [
  { name: "desktop", width: 1280, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`knowledge overview preserves project scope through exploration on ${viewport.name}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const requests: URL[] = [];
    const assertNoUnexpected = await mockApi(page, (request, url) => {
      if (
        request.method() === "GET" &&
        url.pathname === "/api/technical-entry"
      ) {
        requests.push(url);
        const params = url.searchParams;
        const isLearning = params.get("type") === "LEARNING";
        const total = isLearning ? 12 : params.get("status") === "OPEN" ? 1 : 3;
        const perPage = Number(params.get("perPage"));
        const data = Array.from(
          { length: Math.min(perPage, total) },
          (_, index) => ({
            ...entry,
            id: `knowledge-${isLearning ? "learning" : "issue"}-${index}`,
            title: isLearning
              ? [
                  "Understand query invalidation",
                  "Keep URL filters shareable",
                  "Group dates in local time",
                  "Separate server and form state",
                  "Handle partial failures",
                ][index]
              : [
                  "Fix connection pooling",
                  "Prevent stale project names",
                  "Restore keyboard navigation",
                ][index],
            type: isLearning ? "LEARNING" : "ISSUE",
            status: isLearning ? undefined : params.get("status"),
            resolvedAt: isLearning ? undefined : "2026-09-27T02:00:00Z",
          }),
        );
        return {
          body: {
            data,
            meta: {
              currentPage: 1,
              perPage,
              lastPage: Math.ceil(total / perPage),
              total,
            },
          },
        };
      }
      return authenticatedApi(request, url);
    });
    await page.goto("/knowledge-overview");
    await expect(
      page.getByRole("heading", { name: "Knowledge Overview" }),
    ).toBeVisible();
    await expect(page.getByText("75%", { exact: true })).toBeVisible();
    await expect(
      page
        .getByRole("region", { name: "Recent learnings" })
        .getByRole("listitem"),
    ).toHaveCount(5);
    const resolved = page.getByRole("region", {
      name: "Recently resolved issues",
    });
    await expect(resolved.locator("time").first()).toHaveText(
      "September 26, 2026",
    );
    await page.screenshot({
      path: testInfo.outputPath(`knowledge-overview-${viewport.name}.png`),
      fullPage: true,
    });

    await page
      .getByRole("combobox", { name: "Project" })
      .selectOption({ label: project.name });
    await expect(page).toHaveURL(new RegExp(`projectId=${projectId}`));
    await expect
      .poll(
        () =>
          requests.filter(
            (url) => url.searchParams.get("projectId") === projectId,
          ).length,
      )
      .toBe(5);
    const explore = page.getByRole("link", {
      name: "View all resolved issues",
    });
    await explore.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "Technical journal" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Project scope" }),
    ).toBeVisible();
    await expect
      .poll(() => requests.at(-1)?.searchParams.get("perPage"))
      .toBe("10");
    expect(requests.at(-1)?.searchParams.get("projectId")).toBe(projectId);
    expect(requests.at(-1)?.searchParams.get("status")).toBe("RESOLVED");
    await page.goBack();
    await expect(page.getByRole("combobox", { name: "Project" })).toHaveValue(
      projectId,
    );
    await page.getByRole("button", { name: "Clear project filter" }).click();
    await expect(page.getByRole("combobox", { name: "Project" })).toHaveValue(
      "",
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    assertNoUnexpected();
  });
}
