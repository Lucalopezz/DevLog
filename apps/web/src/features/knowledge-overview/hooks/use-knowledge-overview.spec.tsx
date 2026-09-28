import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import {
  useArchiveTechnicalEntry,
  useReopenTechnicalIssue,
  useResolveTechnicalIssue,
} from "@/features/technical-entry/hooks/use-technical-entry-lifecycle";
import { useDeleteTechnicalEntry } from "@/features/technical-entry/hooks/use-delete-technical-entry";
import { createTechnicalEntry } from "@/test/factories/technical-entry";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";
import { useKnowledgeOverview } from "./use-knowledge-overview";

const entryId = "33333333-3333-4333-8333-333333333333";

function OverviewHarness() {
  const queries = useKnowledgeOverview();
  const resolve = useResolveTechnicalIssue();
  const reopen = useReopenTechnicalIssue();
  const archive = useArchiveTechnicalEntry();
  const remove = useDeleteTechnicalEntry();
  return (
    <>
      <output aria-label="Open total">
        {queries.openIssues.data?.meta.total}
      </output>
      <output aria-label="Resolved total">
        {queries.resolvedIssues.data?.meta.total}
      </output>
      <output aria-label="Recent resolved">
        {queries.recentResolvedIssues.data?.data
          .map((entry) => entry.title)
          .join(", ")}
      </output>
      <button
        onClick={() =>
          resolve.mutate({
            technicalEntryId: entryId,
            input: { conclusion: "Use one connection pool." },
          })
        }
        type="button"
      >
        Resolve
      </button>
      <button onClick={() => reopen.mutate(entryId)} type="button">
        Reopen
      </button>
      <button onClick={() => archive.mutate(entryId)} type="button">
        Archive
      </button>
      <button onClick={() => remove.mutate(entryId)} type="button">
        Delete
      </button>
    </>
  );
}

it.each(["Archive", "Delete"])(
  "refreshes totals and recent resolutions after resolving, reopening, and %s",
  async (action) => {
    let current = createTechnicalEntry({
      id: entryId,
      title: "Connection issue",
      type: "ISSUE",
      status: "OPEN",
      projectId: undefined,
    });
    let deleted = false;
    server.use(
      http.get(apiUrl("/technical-entry"), ({ request }) => {
        const params = new URL(request.url).searchParams;
        const entries =
          !deleted &&
          !current.archivedAt &&
          params.get("type") === current.type &&
          params.get("status") === current.status
            ? [current]
            : [];
        return HttpResponse.json({
          data: entries,
          meta: {
            currentPage: 1,
            perPage: Number(params.get("perPage")),
            lastPage: 1,
            total: entries.length,
          },
        });
      }),
      http.patch(apiUrl(`/technical-entry/${entryId}/resolve`), () => {
        current = {
          ...current,
          status: "RESOLVED",
          resolvedAt: "2026-09-27T12:00:00Z",
        };
        return HttpResponse.json(current);
      }),
      http.patch(apiUrl(`/technical-entry/${entryId}/reopen`), () => {
        current = { ...current, status: "OPEN", resolvedAt: undefined };
        return HttpResponse.json(current);
      }),
      http.patch(apiUrl(`/technical-entry/${entryId}/archive`), () => {
        current = { ...current, archivedAt: "2026-09-27T13:00:00Z" };
        return HttpResponse.json(current);
      }),
      http.delete(apiUrl(`/technical-entry/${entryId}`), () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderWithProviders(<OverviewHarness />);
    await waitFor(() =>
      expect(screen.getByLabelText("Open total")).toHaveTextContent("1"),
    );
    await user.click(
      screen.getByRole("button", { name: "Resolve" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Resolved total")).toHaveTextContent("1"),
    );
    expect(screen.getByLabelText("Open total")).toHaveTextContent("0");
    await waitFor(() =>
      expect(screen.getByLabelText("Recent resolved")).toHaveTextContent(
        current.title,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Reopen" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Open total")).toHaveTextContent("1"),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Recent resolved")).toBeEmptyDOMElement(),
    );
    await user.click(
      screen.getByRole("button", { name: "Resolve" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Resolved total")).toHaveTextContent("1"),
    );
    await user.click(screen.getByRole("button", { name: action }));
    await waitFor(() =>
      expect(screen.getByLabelText("Resolved total")).toHaveTextContent("0"),
    );
    expect(screen.getByLabelText("Open total")).toHaveTextContent("0");
    await waitFor(() =>
      expect(screen.getByLabelText("Recent resolved")).toBeEmptyDOMElement(),
    );
  },
);
