import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { projectDetailKeys } from "@/features/projects/api/list-project-details";
import { technicalEntriesKeys } from "@/features/technical-entry/api/list-technical-entries";
import { createTestQueryClient } from "@/test/query-client";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";

import { tagKeys } from "../api/list-tags";
import { useDeleteTag } from "./use-delete-tag";

const tagId = "44444444-4444-4444-8444-444444444444";
const entryId = "33333333-3333-4333-8333-333333333333";
const projectId = "22222222-2222-4222-8222-222222222222";

describe("useDeleteTag", () => {
  it("invalidates tag, entry, and project-detail queries", async () => {
    const client = createTestQueryClient();
    const projectParams = { page: 1, perPage: 6 } as const;
    const queryKeys = [
      tagKeys.list({ page: 1, perPage: 100 }),
      technicalEntriesKeys.list({ page: 1, perPage: 10 }),
      ["technical-entry", entryId],
      projectDetailKeys.technicalEntries(projectId, projectParams),
    ];

    queryKeys.forEach((queryKey) => client.setQueryData(queryKey, {}));
    server.use(
      http.delete(apiUrl(`/tag/${tagId}`), () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );

    function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useDeleteTag(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync(tagId);
    });

    queryKeys.forEach((queryKey) => {
      expect(client.getQueryState(queryKey)?.isInvalidated).toBe(true);
    });
  });
});
