import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { createProjectCollection, createProjectFixture } from "@/test/factories/project";
import { createTechnicalEntry } from "@/test/factories/technical-entry";
import { createUser } from "@/test/factories/user";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";
import HomePage from "./home-page";

const baseMeta = {
  currentPage: 1,
  perPage: 1,
  lastPage: 1,
  total: 0,
};

describe("HomePage", () => {
  it("presents account totals and recent work from the dashboard queries", async () => {
    const project = createProjectFixture({ name: "Developer notebook" });
    const entry = createTechnicalEntry({ title: "Keep query keys predictable" });
    const requestedUrls: URL[] = [];

    server.use(
      http.get(apiUrl("/users/me"), () =>
        HttpResponse.json(createUser({ name: "Ada Lovelace" })),
      ),
      http.get(apiUrl("/project"), ({ request }) => {
        requestedUrls.push(new URL(request.url));
        return HttpResponse.json(
          createProjectCollection({
            projects: [project],
            meta: { ...baseMeta, perPage: 3, total: 4 },
          }),
        );
      }),
      http.get(apiUrl("/technical-entry"), ({ request }) => {
        const url = new URL(request.url);
        requestedUrls.push(url);

        // The small count-only request is distinct from the recent-entries
        // request, even though both reuse the same collection endpoint.
        if (url.searchParams.get("status") === "OPEN") {
          return HttpResponse.json({
            data: [],
            meta: { ...baseMeta, total: 2 },
          });
        }

        return HttpResponse.json({
          data: [entry],
          meta: { ...baseMeta, perPage: 5, total: 12 },
        });
      }),
      http.get(apiUrl("/tag"), ({ request }) => {
        requestedUrls.push(new URL(request.url));
        return HttpResponse.json({
          data: [],
          meta: { ...baseMeta, total: 9 },
        });
      }),
    );

    renderWithProviders(<HomePage />);

    expect(
      await screen.findByRole("heading", { name: "Welcome back, Ada." }),
    ).toBeVisible();
    const summary = screen.getByRole("region", { name: "Workspace summary" });
    expect(within(summary).getByText("4")).toBeVisible();
    expect(within(summary).getByText("12")).toBeVisible();
    expect(within(summary).getByText("2")).toBeVisible();
    expect(within(summary).getByText("9")).toBeVisible();

    expect(await screen.findByText(entry.title)).toBeVisible();
    expect(screen.getByText(project.name)).toBeVisible();
    expect(screen.getByText(entry.title).closest("a")).toHaveAttribute(
      "href",
      `/technical-entries/${entry.id}`,
    );

    const projectRequest = requestedUrls.find(
      (url) => url.pathname.endsWith("/project"),
    );
    const recentEntriesRequest = requestedUrls.find(
      (url) =>
        url.pathname.endsWith("/technical-entry") &&
        url.searchParams.get("perPage") === "5",
    );
    const openIssuesRequest = requestedUrls.find(
      (url) => url.searchParams.get("status") === "OPEN",
    );

    expect(projectRequest?.searchParams.get("perPage")).toBe("3");
    expect(projectRequest?.searchParams.get("sort")).toBe("updatedAt");
    expect(recentEntriesRequest?.searchParams.get("sortDir")).toBe("desc");
    expect(openIssuesRequest?.searchParams.get("type")).toBe("ISSUE");
  });
});
