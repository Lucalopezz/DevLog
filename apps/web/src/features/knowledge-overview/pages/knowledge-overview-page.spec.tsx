import { act, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes, useNavigate } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { technicalEntriesKeys } from "@/features/technical-entry/api/list-technical-entries";
import TechnicalEntriesPage from "@/features/technical-entry/pages/technical-entries-page";
import { deferred } from "@/test/deferred";
import { createProjectFixture } from "@/test/factories/project";
import { createTechnicalEntry } from "@/test/factories/technical-entry";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";
import KnowledgeOverviewPage from "./knowledge-overview-page";

const project = createProjectFixture();
const learning = createTechnicalEntry({
  title: "Learn query invalidation",
  projectId: undefined,
  status: undefined,
});
const issue = createTechnicalEntry({
  id: "resolved-issue",
  title: "Fix connection pool",
  type: "ISSUE",
  status: "RESOLVED",
  createdAt: "2026-08-01T12:00:00Z",
  resolvedAt: "2026-09-26T12:00:00Z",
});

function key(url: URL) {
  return [
    url.searchParams.get("perPage"),
    url.searchParams.get("type"),
    url.searchParams.get("status") ?? "",
  ].join(":");
}

function response(
  url: URL,
  totals = { learnings: 1200, open: 1, resolved: 3 },
) {
  const isLearning = url.searchParams.get("type") === "LEARNING";
  const total = isLearning
    ? totals.learnings
    : url.searchParams.get("status") === "OPEN"
      ? totals.open
      : totals.resolved;
  return {
    data: total === 0 ? [] : [isLearning ? learning : issue],
    meta: {
      currentPage: 1,
      perPage: Number(url.searchParams.get("perPage")),
      lastPage: total,
      total,
    },
  };
}

function HistoryControls() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(-1)} type="button">
      Back
    </button>
  );
}

function renderOverview(route = "/knowledge-overview") {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/knowledge-overview" element={<KnowledgeOverviewPage />} />
        <Route path="/technical-entries" element={<TechnicalEntriesPage />} />
      </Routes>
      <HistoryControls />
    </>,
    { route },
  );
}

function metric(label: string) {
  return within(screen.getByRole("article", { name: label }));
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

describe("Knowledge Overview", () => {
  it("uses server totals and distinct creation/resolution ordering with unarchived scope", async () => {
    const requests: URL[] = [];
    server.use(
      http.get(apiUrl("/technical-entry"), ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        return HttpResponse.json(response(url));
      }),
    );
    renderOverview();
    expect(await metric("Learnings").findByText("1,200")).toBeVisible();
    expect(await metric("Open issues").findByText("1")).toBeVisible();
    expect(await metric("Resolved issues").findByText("3")).toBeVisible();
    const meter = await screen.findByRole("meter", {
      name: "Resolved share of issues",
    });
    expect(meter).toHaveAttribute("aria-valuenow", "3");
    expect(meter).toHaveAttribute("aria-valuemax", "4");
    expect(screen.getByText("75%")).toBeVisible();
    const resolvedList = within(
      screen.getByRole("region", { name: "Recently resolved issues" }),
    );
    expect(resolvedList.getByText("September 26, 2026")).toHaveAttribute(
      "datetime",
      issue.resolvedAt,
    );
    expect(resolvedList.queryByText("August 1, 2026")).not.toBeInTheDocument();
    expect(
      resolvedList.getByRole("link", { name: issue.title }),
    ).toHaveAttribute("href", `/technical-entries/${issue.id}`);
    expect(screen.getByRole("link", { name: learning.title })).toHaveAttribute(
      "href",
      `/technical-entries/${learning.id}`,
    );
    expect(requests).toHaveLength(5);
    for (const url of requests) {
      expect(url.searchParams.get("archivedAt")).toBe("null");
      expect(url.searchParams.get("page")).toBe("1");
      expect(url.searchParams.has("projectId")).toBe(false);
    }
    expect(
      requests
        .filter((url) => url.searchParams.get("perPage") === "1")
        .map(key)
        .sort(),
    ).toEqual(["1:ISSUE:OPEN", "1:ISSUE:RESOLVED", "1:LEARNING:"]);
    expect(
      requests
        .find((url) => key(url) === "5:LEARNING:")
        ?.searchParams.get("sort"),
    ).toBe("createdAt");
    expect(
      requests
        .find((url) => key(url) === "5:ISSUE:RESOLVED")
        ?.searchParams.get("sort"),
    ).toBe("resolvedAt");
    expect(
      requests
        .filter((url) => url.searchParams.get("perPage") === "5")
        .every((url) => url.searchParams.get("sortDir") === "desc"),
    ).toBe(true);
  });

  it("keeps loading separate from zero and explains an undefined percentage with no issues", async () => {
    const gate = deferred<void>();
    server.use(
      http.get(apiUrl("/technical-entry"), async ({ request }) => {
        await gate.promise;
        return HttpResponse.json(
          response(new URL(request.url), {
            learnings: 0,
            open: 0,
            resolved: 0,
          }),
        );
      }),
    );
    renderOverview();
    try {
      expect(metric("Learnings").getByRole("status")).toBeVisible();
      expect(
        screen.getByRole("status", { name: "Loading issue composition" }),
      ).toBeVisible();
      expect(screen.queryByText("0")).not.toBeInTheDocument();
      expect(screen.queryByText("—")).not.toBeInTheDocument();
    } finally {
      gate.resolve(undefined);
    }
    expect(
      await screen.findByLabelText("Resolved issues percentage unavailable"),
    ).toHaveTextContent("—");
    expect(screen.getByText(/There are no issues in this scope/)).toBeVisible();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(metric("Open issues").getByText("0")).toBeVisible();
    expect(screen.getByText("No learnings in this scope yet.")).toBeVisible();
    expect(
      screen.getByText("No resolved issues in this scope yet."),
    ).toBeVisible();
  });

  it.each([
    { open: 4, resolved: 0, percentage: "0%" },
    { open: 0, resolved: 4, percentage: "100%" },
    { open: 2, resolved: 1, percentage: "33.3%" },
  ])(
    "shows $percentage for a valid issue composition",
    async ({ open, resolved, percentage }) => {
      server.use(
        http.get(apiUrl("/technical-entry"), ({ request }) =>
          HttpResponse.json(
            response(new URL(request.url), { learnings: 0, open, resolved }),
          ),
        ),
      );
      renderOverview();
      expect(await screen.findByText(percentage)).toBeVisible();
      expect(screen.getByRole("meter")).toHaveAttribute(
        "aria-valuemax",
        String(open + resolved),
      );
    },
  );

  it.each([
    { failed: "1:LEARNING:", retry: "Retry learnings", label: "Learnings" },
    {
      failed: "1:ISSUE:OPEN",
      retry: "Retry open issues",
      label: "Open issues",
    },
    {
      failed: "1:ISSUE:RESOLVED",
      retry: "Retry resolved issues",
      label: "Resolved issues",
    },
    {
      failed: "5:LEARNING:",
      retry: "Retry recent learnings",
      label: undefined,
    },
    {
      failed: "5:ISSUE:RESOLVED",
      retry: "Retry recently resolved issues",
      label: undefined,
    },
  ])(
    "isolates failure $failed and retries only that query",
    async ({ failed, retry, label }) => {
      const requests: string[] = [];
      let shouldFail = true;
      server.use(
        http.get(apiUrl("/technical-entry"), ({ request }) => {
          const url = new URL(request.url);
          requests.push(key(url));
          return shouldFail && key(url) === failed
            ? HttpResponse.json({}, { status: 500 })
            : HttpResponse.json(response(url));
        }),
      );
      const { user } = renderOverview();
      const retryButton = await screen.findByRole("button", {
        name: retry,
      });
      if (label) expect(metric(label).queryByText("0")).not.toBeInTheDocument();
      if (failed === "1:ISSUE:OPEN" || failed === "1:ISSUE:RESOLVED") {
        expect(
          screen.getByText(/Issue composition is unavailable/),
        ).toBeVisible();
        expect(screen.queryByRole("meter")).not.toBeInTheDocument();
        expect(
          await screen.findByRole("link", { name: learning.title }),
        ).toBeVisible();
      } else {
        expect(await screen.findByText("75%")).toBeVisible();
      }
      expect(
        screen.queryByText("No learnings in this scope yet."),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("No resolved issues in this scope yet."),
      ).not.toBeInTheDocument();
      shouldFail = false;
      await user.click(retryButton);
      await waitFor(() =>
        expect(
          screen.queryByRole("button", { name: retry }),
        ).not.toBeInTheDocument(),
      );
      expect(await screen.findByText("75%")).toBeVisible();
      expect(requests).toHaveLength(6);
      expect(requests.at(-1)).toBe(failed);
    },
  );

  it("hides stale totals and their derived ratio after a failed background refresh", async () => {
    let shouldFail = false;
    server.use(
      http.get(apiUrl("/technical-entry"), ({ request }) => {
        const url = new URL(request.url);
        return shouldFail && key(url) === "1:ISSUE:RESOLVED"
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json(response(url));
      }),
    );
    const { client } = renderOverview();
    await screen.findByText("75%");
    shouldFail = true;
    await act(async () => {
      await client.invalidateQueries({
        queryKey: technicalEntriesKeys.lists(),
      });
    });
    expect(
      await screen.findByRole("button", {
        name: "Retry resolved issues",
      }),
    ).toBeVisible();
    expect(metric("Resolved issues").queryByText("3")).not.toBeInTheDocument();
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(metric("Learnings").getByText("1,200")).toBeVisible();
  });

  it("applies a project to all five blocks without mixing old data, and supports browser history", async () => {
    const requests: URL[] = [];
    const gate = deferred<void>();
    server.use(
      http.get(apiUrl("/technical-entry"), async ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        if (url.searchParams.has("projectId")) {
          await gate.promise;
          return HttpResponse.json(
            response(url, { learnings: 2, open: 1, resolved: 1 }),
          );
        }
        return HttpResponse.json(response(url));
      }),
    );
    const { user } = renderOverview();
    await screen.findByText("75%");
    await screen.findByRole("option", { name: project.name });
    try {
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Project" }),
        project.id,
      );
      expect(metric("Learnings").queryByText("1,200")).not.toBeInTheDocument();
      expect(screen.queryByText("75%")).not.toBeInTheDocument();
    } finally {
      gate.resolve(undefined);
    }
    expect(await screen.findByText("50%")).toBeVisible();
    expect(
      requests.filter(
        (url) => url.searchParams.get("projectId") === project.id,
      ),
    ).toHaveLength(5);
    for (const name of [
      "Explore learnings",
      "Explore open issues",
      "Explore resolved issues",
      "View all learnings",
      "View all resolved issues",
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        expect.stringContaining(`projectId=${project.id}`),
      );
    }
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("combobox", { name: "Project" })).toHaveValue("");
    expect(await screen.findByText("75%")).toBeVisible();
  });

  it("keeps the project scope when opening the journal, searching, and paginating", async () => {
    const requests: URL[] = [];
    server.use(
      http.get(apiUrl("/technical-entry"), ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        return HttpResponse.json(response(url));
      }),
    );
    const { user } = renderOverview(
      `/knowledge-overview?projectId=${project.id}`,
    );
    await screen.findByText("75%");
    expect(requests).toHaveLength(5);
    expect(
      requests.every((url) => url.searchParams.get("projectId") === project.id),
    ).toBe(true);
    await user.click(screen.getByRole("link", { name: "View all learnings" }));
    expect(
      await screen.findByRole("heading", { name: "Technical journal" }),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "Project scope" })).toBeVisible();
    await screen.findByRole("link", { name: new RegExp(learning.title) });
    expect(requests.at(-1)?.searchParams.get("projectId")).toBe(project.id);
    expect(requests.at(-1)?.searchParams.get("type")).toBe("LEARNING");
    await user.type(screen.getByRole("textbox", { name: "Title" }), "query");
    await user.click(
      screen.getByRole("button", { name: "Search" }),
    );
    await waitFor(() =>
      expect(requests.at(-1)?.searchParams.get("title")).toBe("query"),
    );
    expect(requests.at(-1)?.searchParams.get("projectId")).toBe(project.id);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Go to the next page" }),
      ).toBeEnabled(),
    );
    await user.click(
      screen.getByRole("button", { name: "Go to the next page" }),
    );
    await waitFor(() =>
      expect(requests.at(-1)?.searchParams.get("page")).toBe("2"),
    );
    expect(requests.at(-1)?.searchParams.get("projectId")).toBe(project.id);
    await user.click(screen.getByRole("button", { name: "Show all projects" }));
    await waitFor(() =>
      expect(requests.at(-1)?.searchParams.has("projectId")).toBe(false),
    );
    expect(requests.at(-1)?.searchParams.get("type")).toBe("LEARNING");
    expect(requests.at(-1)?.searchParams.get("page")).toBe("1");
    expect(
      screen.queryByRole("region", { name: "Project scope" }),
    ).not.toBeInTheDocument();
  });

  it("keeps totals available after project options fail and retries that lookup separately", async () => {
    let entryRequests = 0;
    let shouldFail = true;
    server.use(
      http.get(apiUrl("/project"), () =>
        shouldFail
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json({
              data: [project],
              meta: { currentPage: 1, lastPage: 1, perPage: 100, total: 1 },
            }),
      ),
      http.get(apiUrl("/technical-entry"), ({ request }) => {
        entryRequests += 1;
        return HttpResponse.json(response(new URL(request.url)));
      }),
    );
    const { user } = renderOverview(
      `/knowledge-overview?projectId=${project.id}`,
    );
    expect(await screen.findByText("75%")).toBeVisible();
    expect(
      await screen.findByText("Could not load project filter options."),
    ).toBeVisible();
    shouldFail = false;
    await user.click(screen.getByRole("button", { name: "Retry projects" }));
    expect(
      await screen.findByRole("option", { name: project.name }),
    ).toBeInTheDocument();
    expect(entryRequests).toBe(5);
    await user.click(
      screen.getByRole("button", { name: "Clear project filter" }),
    );
    await waitFor(() => expect(entryRequests).toBe(10));
    expect(screen.getByRole("combobox", { name: "Project" })).toHaveValue("");
  });
});
