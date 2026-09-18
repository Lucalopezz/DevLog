import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createTechnicalEntry as createTechnicalEntryFixture } from "@/test/factories/technical-entry";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";

import {
  archiveTechnicalEntry,
  restoreTechnicalEntry,
} from "./archive-technical-entry";
import { createTechnicalEntry } from "./create-technical-entry";
import { deleteTechnicalEntry } from "./delete-technical-entry";
import { getTechnicalEntry } from "./get-technical-entry";
import { listTechnicalEntries } from "./list-technical-entries";
import { updateTechnicalEntry } from "./update-technical-entry";
import { assignTagToTechnicalEntry } from "./assign-tag-to-technical-entry";
import { removeTagFromTechnicalEntry } from "./remove-tag-from-technical-entry";
import { createTag } from "@/test/factories/tag";

const entryId = "33333333-3333-4333-8333-333333333333";

describe("technical entry API contracts", () => {
  it("sends list filters as query parameters and unwraps the collection", async () => {
    const collection = {
      data: [createTechnicalEntryFixture()],
      meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
    };
    let capturedUrl: URL | undefined;

    server.use(
      http.get(apiUrl("/technical-entry"), ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(collection);
      }),
    );

    await expect(
      listTechnicalEntries({
        page: 1,
        perPage: 10,
        title: "query",
        type: "LEARNING",
        status: "OPEN",
        projectId: "22222222-2222-4222-8222-222222222222",
        archivedAt: "null",
        sort: "updatedAt",
        sortDir: "desc",
      }),
    ).resolves.toEqual(collection);
    expect(Object.fromEntries(capturedUrl?.searchParams ?? [])).toEqual({
      page: "1",
      perPage: "10",
      title: "query",
      type: "LEARNING",
      status: "OPEN",
      projectId: "22222222-2222-4222-8222-222222222222",
      archivedAt: "null",
      sort: "updatedAt",
      sortDir: "desc",
    });
  });

  it("posts the create payload and unwraps the entry", async () => {
    const input = {
      title: "Understand MSW",
      context: "Test at the HTTP boundary.",
      type: "LEARNING" as const,
      conclusion: "",
      projectId: null,
    };
    const entry = createTechnicalEntryFixture({
      ...input,
      projectId: undefined,
    });
    let capturedBody: unknown;

    server.use(
      http.post(apiUrl("/technical-entry"), async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(entry, { status: 201 });
      }),
    );

    await expect(createTechnicalEntry(input)).resolves.toEqual(entry);
    expect(capturedBody).toEqual(input);
  });

  it("gets, patches null-clearing fields, and deletes an entry", async () => {
    const entry = createTechnicalEntryFixture();
    const input = { projectId: null, conclusion: null };
    let capturedPatch: unknown;
    let deleteCount = 0;

    server.use(
      http.get(apiUrl(`/technical-entry/${entryId}`), () =>
        HttpResponse.json(entry),
      ),
      http.patch(apiUrl(`/technical-entry/${entryId}`), async ({ request }) => {
        capturedPatch = await request.json();
        return HttpResponse.json({
          ...entry,
          projectId: undefined,
          conclusion: undefined,
        });
      }),
      http.delete(apiUrl(`/technical-entry/${entryId}`), () => {
        deleteCount += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(getTechnicalEntry(entryId)).resolves.toEqual(entry);
    await expect(updateTechnicalEntry(entryId, input)).resolves.toMatchObject({
      id: entryId,
    });
    await expect(deleteTechnicalEntry(entryId)).resolves.toBeUndefined();
    expect(capturedPatch).toEqual(input);
    expect(deleteCount).toBe(1);
  });

  it("uses the archive and restore PATCH suffixes", async () => {
    const entry = createTechnicalEntryFixture();
    const calls: string[] = [];

    server.use(
      http.patch(
        apiUrl(`/technical-entry/${entryId}/archive`),
        ({ request }) => {
          calls.push(new URL(request.url).pathname);
          return HttpResponse.json({
            ...entry,
            archivedAt: "2026-09-15T12:00:00Z",
          });
        },
      ),
      http.patch(
        apiUrl(`/technical-entry/${entryId}/restore`),
        ({ request }) => {
          calls.push(new URL(request.url).pathname);
          return HttpResponse.json(entry);
        },
      ),
    );

    await archiveTechnicalEntry(entryId);
    await restoreTechnicalEntry(entryId);

    expect(calls).toEqual([
      `/api/technical-entry/${entryId}/archive`,
      `/api/technical-entry/${entryId}/restore`,
    ]);
  });

  it("propagates a 422 validation response", async () => {
    server.use(
      http.post(apiUrl("/technical-entry"), () =>
        HttpResponse.json(
          { message: ["Title is too short."] },
          { status: 422 },
        ),
      ),
    );

    await expect(
      createTechnicalEntry({
        title: "No",
        context: "Invalid title boundary.",
        type: "ISSUE",
      }),
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
  it("assigns a tag to an entry", async () => {
    const entryId = "11111111-1111-4111-8111-111111111111";
    const tag = createTag();
    let body: unknown;

    server.use(
      http.post(
        apiUrl(`/technical-entry/${entryId}/tags`),
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(tag, { status: 201 });
        },
      ),
    );

    await expect(
      assignTagToTechnicalEntry({
        technicalEntryId: entryId,
        tagId: tag.id,
      }),
    ).resolves.toEqual(tag);

    expect(body).toEqual({ tagId: tag.id });
  });

  it("removes a tag from an entry", async () => {
    const entryId = "11111111-1111-4111-8111-111111111111";
    const tagId = "22222222-2222-4222-8222-222222222222";

    server.use(
      http.delete(
        apiUrl(`/technical-entry/${entryId}/tags/${tagId}`),
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(
      removeTagFromTechnicalEntry({
        technicalEntryId: entryId,
        tagId,
      }),
    ).resolves.toBeUndefined();
  });

  it("propagates a tag assignment validation response", async () => {
    server.use(
      http.post(
        apiUrl(`/technical-entry/${entryId}/tags`),
        () =>
          HttpResponse.json(
            { message: ["Tag ID must be a valid UUID"] },
            { status: 422 },
          ),
      ),
    );

    await expect(
      assignTagToTechnicalEntry({
        technicalEntryId: entryId,
        tagId: "invalid-tag-id",
      }),
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
});
