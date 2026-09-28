import { expect, test } from "@playwright/test";
import { authenticatedApi, entry, mockApi } from "./mock-api";

// Real browser time-zone emulation catches accidental UTC grouping even when
// the unit test process itself runs in UTC.
test.use({ timezoneId: "America/Sao_Paulo" });

for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`timeline groups local days and supports keyboard pagination on ${viewport.name}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      ...entry,
      id: `entry-${index}`,
      title:
        index === 0
          ? "After local midnight"
          : `Connection pooling note ${index}`,
      type: "ISSUE",
      status: "OPEN",
      tags: [{ id: "tag-1", name: "database" }],
      createdAt: index === 0 ? "2026-09-27T03:01:00Z" : "2026-09-27T02:59:00Z",
    }));
    const older = {
      ...entry,
      title: "Before local midnight",
      projectId: undefined,
      status: undefined,
      createdAt: "2026-09-27T02:58:00Z",
    };
    const requests: number[] = [];
    const assertNoUnexpected = await mockApi(page, (request, url) => {
      if (
        request.method() === "GET" &&
        url.pathname === "/api/technical-entry"
      ) {
        const currentPage = Number(url.searchParams.get("page"));
        requests.push(currentPage);
        expect(url.searchParams.get("perPage")).toBe("20");
        expect(url.searchParams.get("archivedAt")).toBe("null");
        return {
          body: {
            data: currentPage === 1 ? firstPage : [older],
            meta: { currentPage, perPage: 20, lastPage: 2, total: 21 },
          },
        };
      }
      return authenticatedApi(request, url);
    });

    await page.goto("/activity-timeline");
    await expect(
      page.getByRole("heading", { name: "Activity Timeline" }),
    ).toBeVisible();
    const today = page.getByRole("region", { name: "September 27, 2026" });
    const yesterday = page.getByRole("region", { name: "September 26, 2026" });
    await expect(
      today.getByRole("link", { name: "After local midnight" }),
    ).toBeVisible();
    await expect(today.locator("article time")).toHaveText(/12:01 AM/);
    await expect(yesterday.getByRole("article")).toHaveCount(19);

    await page.screenshot({
      path: testInfo.outputPath(`timeline-${viewport.name}.png`),
    });
    const loadMore = page.getByRole("button", {
      name: "Load more",
      exact: true,
    });
    await loadMore.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("21 entries loaded")).toBeVisible();
    await expect(yesterday.getByRole("article")).toHaveCount(20);
    await expect(
      page.getByRole("heading", { name: "September 26, 2026" }),
    ).toHaveCount(1);
    await expect(yesterday.getByText("No project")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "All entries loaded" }),
    ).toBeDisabled();
    expect(requests).toEqual([1, 2]);

    const fitsViewport = await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    );
    expect(fitsViewport).toBe(true);
    const detail = page.getByRole("link", { name: older.title });
    await detail.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(`/technical-entries/${entry.id}`);
    assertNoUnexpected();
  });
}
