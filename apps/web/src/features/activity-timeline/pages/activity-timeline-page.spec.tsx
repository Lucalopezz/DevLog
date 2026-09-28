import { act, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useLocation, useNavigate } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { technicalEntriesKeys } from "@/features/technical-entry/api/list-technical-entries";
import type { TechnicalEntry } from "@/features/technical-entry/types/technical-entry";
import { deferred } from "@/test/deferred";
import { createProjectFixture } from "@/test/factories/project";
import { createTechnicalEntry } from "@/test/factories/technical-entry";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";
import ActivityTimelinePage from "./activity-timeline-page";

const project = createProjectFixture({ name: "DevLog" });
const issue = createTechnicalEntry({
  title: "Fix connection pooling",
  projectId: project.id,
  type: "ISSUE",
  status: "RESOLVED",
  createdAt: "2026-09-27T15:00:00Z",
  tags: [{ id: "tag-1", name: "database" }],
});
const learning = createTechnicalEntry({
  id: "44444444-4444-4444-8444-444444444444",
  title: "Understand connection pools",
  projectId: undefined,
  type: "LEARNING",
  status: undefined,
  createdAt: "2026-09-27T14:00:00Z",
});

function collection(
  data: TechnicalEntry[],
  currentPage = 1,
  lastPage = 1,
  total = data.length,
) {
  return { data, meta: { currentPage, perPage: 20, lastPage, total } };
}

function HistoryControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="Current search">{location.search}</output>
      <button onClick={() => navigate(-1)} type="button">
        Back
      </button>
    </>
  );
}

function renderTimeline(route = "/activity-timeline") {
  return renderWithProviders(
    <>
      <ActivityTimelinePage />
      <HistoryControls />
    </>,
    { route },
  );
}

beforeEach(() => {
  server.use(
    http.get(apiUrl("/project"), () =>
      HttpResponse.json({
        data: [project],
        meta: { currentPage: 1, perPage: 100, lastPage: 1, total: 1 },
      }),
    ),
  );
});

describe("Activity Timeline", () => {
  it("requests active entries in creation order and shows current metadata and detail links", async () => {
    let requested: URL | undefined;
    server.use(
      http.get(apiUrl("/technical-entry"), ({ request }) => {
        requested = new URL(request.url);
        return HttpResponse.json(collection([issue, learning]));
      }),
    );
    renderTimeline(
      "/activity-timeline?archivedAt=not-null&sort=updatedAt&page=7&type=UNKNOWN",
    );

    const title = await screen.findByRole("link", { name: issue.title });
    expect(title).toHaveAttribute("href", `/technical-entries/${issue.id}`);
    expect(screen.getByRole("link", { name: learning.title })).toHaveAttribute(
      "href",
      `/technical-entries/${learning.id}`,
    );
    const card = within(title.closest("article")!);
    expect(await card.findByText(project.name)).toBeVisible();
    expect(card.getByText("Current status: Resolved")).toBeVisible();
    expect(card.getByText("#database")).toBeVisible();
    expect(card.getByText("Issue")).toBeVisible();
    expect(title.closest("article")?.querySelector("time")).toHaveAttribute(
      "datetime",
      issue.createdAt,
    );
    expect(screen.getByText("No project")).toBeVisible();
    expect(screen.getAllByText(/Current status:/)).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "All entries loaded" }),
    ).toBeDisabled();
    expect(Object.fromEntries(requested!.searchParams)).toEqual({
      page: "1",
      perPage: "20",
      sort: "createdAt",
      sortDir: "desc",
      archivedAt: "null",
    });
  });

  it("appends 20 entries at a time, merges a day across pages, and waits before allowing another load", async () => {
    const gate = deferred<void>();
    const pages: number[] = [];
    const firstPage = Array.from({ length: 20 }, (_, index) => ({
      ...issue,
      id: `entry-${index}`,
      title: `Entry ${index}`,
    }));
    server.use(
      http.get(apiUrl("/technical-entry"), async ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page"));
        pages.push(page);
        if (page === 2) await gate.promise;
        return HttpResponse.json(
          collection(page === 1 ? firstPage : [learning], page, 2, 21),
        );
      }),
    );
    const { user } = renderTimeline();
    await screen.findByText("20 entries loaded");
    try {
      await user.click(screen.getByRole("button", { name: "Load more" }));
      expect(
        screen.getByRole("button", { name: "Loading more..." }),
      ).toBeDisabled();
      expect(screen.getByRole("link", { name: "Entry 0" })).toBeVisible();
    } finally {
      gate.resolve(undefined);
    }
    await screen.findByText("21 entries loaded");
    expect(
      screen.getAllByRole("heading", { name: "September 27, 2026" }),
    ).toHaveLength(1);
    expect(screen.getAllByRole("article")).toHaveLength(21);
    expect(
      screen.getByRole("button", { name: "All entries loaded" }),
    ).toBeDisabled();
    expect(pages).toEqual([1, 2]);
  });

  it("starts new filters at page one, does not mix results, and follows browser history", async () => {
    const requests: URL[] = [];
    const gate = deferred<void>();
    server.use(
      http.get(apiUrl("/technical-entry"), async ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        const page = Number(url.searchParams.get("page"));
        if (url.searchParams.get("type") === "LEARNING") {
          await gate.promise;
          return HttpResponse.json(collection([learning]));
        }
        return HttpResponse.json(
          collection(page === 1 ? [issue] : [learning], page, 2, 21),
        );
      }),
    );
    const { user } = renderTimeline();
    await screen.findByRole("link", { name: issue.title });
    await user.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByRole("link", { name: learning.title });
    try {
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Type" }),
        "LEARNING",
      );
      expect(
        screen.getByRole("status", { name: "Loading timeline" }),
      ).toBeVisible();
      expect(
        screen.queryByRole("link", { name: issue.title }),
      ).not.toBeInTheDocument();
    } finally {
      gate.resolve(undefined);
    }
    await screen.findByRole("link", { name: learning.title });
    expect(requests.at(-1)?.searchParams.get("page")).toBe("1");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Project" }),
      project.id,
    );
    await waitFor(() =>
      expect(requests.at(-1)?.searchParams.get("projectId")).toBe(project.id),
    );
    expect(requests.at(-1)?.searchParams.get("type")).toBe("LEARNING");
    expect(requests.at(-1)?.searchParams.get("page")).toBe("1");
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("combobox", { name: "Project" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Type" })).toHaveValue(
      "LEARNING",
    );
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByLabelText("Current search")).toHaveTextContent("");
    expect(screen.getByRole("combobox", { name: "Type" })).toHaveValue("");
    expect(
      await screen.findByRole("link", { name: issue.title }),
    ).toBeVisible();
  });

  it("shows initial loading and a retryable failure without presenting an empty result", async () => {
    const gate = deferred<void>();
    let attempts = 0;
    server.use(
      http.get(apiUrl("/technical-entry"), async () => {
        attempts += 1;
        if (attempts === 1) {
          await gate.promise;
          return HttpResponse.json({ message: "Offline" }, { status: 500 });
        }
        return HttpResponse.json(collection([]));
      }),
    );
    const { user } = renderTimeline();
    try {
      expect(
        screen.getByRole("status", { name: "Loading timeline" }),
      ).toBeVisible();
    } finally {
      gate.resolve(undefined);
    }
    expect(
      await screen.findByRole("heading", { name: "Could not load timeline" }),
    ).toBeVisible();
    expect(screen.queryByText("No entries found")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "No entries found" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();
  });

  it("keeps earlier pages when Load more fails and retries only the failed page", async () => {
    const pages: number[] = [];
    server.use(
      http.get(apiUrl("/technical-entry"), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page"));
        pages.push(page);
        if (pages.length === 2) return HttpResponse.json({}, { status: 500 });
        return HttpResponse.json(
          collection(page === 1 ? [issue] : [learning], page, 2, 21),
        );
      }),
    );
    const { user } = renderTimeline();
    await screen.findByRole("link", { name: issue.title });
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(
      await screen.findByText("Could not load more entries. Try again."),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: issue.title })).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Retry loading more" }),
    );
    expect(
      await screen.findByRole("link", { name: learning.title }),
    ).toBeVisible();
    expect(pages).toEqual([1, 2, 2]);
  });

  it("labels stale entries after a failed refresh and blocks pagination until retry succeeds", async () => {
    let fail = false;
    server.use(
      http.get(apiUrl("/technical-entry"), () =>
        fail
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json(collection([issue], 1, 2, 21)),
      ),
    );
    const { client, user } = renderTimeline();
    await screen.findByRole("link", { name: issue.title });
    fail = true;
    await act(async () => {
      await client.invalidateQueries({
        queryKey: technicalEntriesKeys.lists(),
      });
    });
    expect(
      await screen.findByRole("heading", {
        name: "Could not refresh timeline",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: issue.title })).toBeVisible();
    expect(screen.getByRole("button", { name: "Load more" })).toBeDisabled();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Load more" })).toBeEnabled(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("loads every project page for names and filter options, including archived projects", async () => {
    const archived = createProjectFixture({
      id: "55555555-5555-4555-8555-555555555555",
      name: "Previous project",
      archivedAt: "2026-09-26T00:00:00Z",
    });
    const pages: number[] = [];
    server.use(
      http.get(apiUrl("/project"), ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page"));
        pages.push(page);
        expect(url.searchParams.has("archivedAt")).toBe(false);
        return HttpResponse.json({
          data: page === 1 ? [project] : [archived],
          meta: { currentPage: page, perPage: 100, lastPage: 2, total: 101 },
        });
      }),
      http.get(apiUrl("/technical-entry"), () =>
        HttpResponse.json(collection([{ ...issue, projectId: archived.id }])),
      ),
    );
    renderTimeline();
    expect(
      await screen.findByRole("option", { name: archived.name }),
    ).toBeInTheDocument();
    const title = await screen.findByRole("link", { name: issue.title });
    expect(
      within(title.closest("article")!).getByText(archived.name),
    ).toBeVisible();
    expect(pages).toEqual([1, 2]);
  });

  it("keeps entries readable when project metadata fails and offers an independent retry", async () => {
    let projectAttempts = 0;
    let entryRequests = 0;
    server.use(
      http.get(apiUrl("/project"), () => {
        projectAttempts += 1;
        return projectAttempts === 1
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json({
              data: [project],
              meta: { currentPage: 1, lastPage: 1, perPage: 100, total: 1 },
            });
      }),
      http.get(apiUrl("/technical-entry"), () => {
        entryRequests += 1;
        return HttpResponse.json(collection([issue]));
      }),
    );
    const { user } = renderTimeline();
    expect(
      await screen.findByRole("link", { name: issue.title }),
    ).toBeVisible();
    expect(await screen.findByText("Project unavailable")).toBeVisible();
    expect(screen.queryByText("No project")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Project" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Retry projects" }));
    expect(
      await screen.findByRole("option", { name: project.name }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Project" })).toBeEnabled();
    expect(entryRequests).toBe(1);
  });
});
