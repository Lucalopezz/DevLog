import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import {
  createProjectEnvironment,
  deleteProjectEnvironment,
  environmentKeys,
  listEnvironments,
  listProjectEnvironments,
  updateProjectEnvironment,
} from "./environment-api";

const projectId = "123e4567-e89b-42d3-a456-426614174002";
const environmentId = "123e4567-e89b-42d3-a456-426614174003";
const item = {
  id: environmentId,
  projectId,
  projectName: "DevLog",
  name: "Local",
  category: "LOCAL",
  operatingSystem: null,
  runtime: null,
  runtimeVersion: null,
  description: null,
  createdAt: "2026-09-25T18:00:00.000Z",
  updatedAt: "2026-09-25T18:00:00.000Z",
};
const collection = {
  data: [item],
  meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 1 },
};
describe("environment HTTP API", () => {
  it("serializes only supplied filters and distinguishes query keys", async () => {
    let globalSearch = "";
    let projectSearch = "";
    server.use(
      http.get(apiUrl("/project/environments"), ({ request }) => {
        globalSearch = new URL(request.url).search;
        return HttpResponse.json(collection);
      }),
      http.get(apiUrl(`/project/${projectId}/environments`), ({ request }) => {
        projectSearch = new URL(request.url).search;
        return HttpResponse.json(collection);
      }),
    );
    await listEnvironments({ page: 2, category: "LOCAL" });
    await listProjectEnvironments(projectId, { page: 1 });
    expect(globalSearch).toContain("page=2");
    expect(globalSearch).toContain("category=LOCAL");
    expect(globalSearch).not.toContain("projectId");
    expect(projectSearch).toContain("page=1");
    expect(environmentKeys.list({ page: 1 })).not.toEqual(
      environmentKeys.list({ page: 2 }),
    );
    expect(environmentKeys.projectList(projectId, { page: 1 })).not.toEqual(
      environmentKeys.list({ page: 1 }),
    );
  });
  it("uses project-scoped URLs and sends the documented mutation payloads", async () => {
    const requests: Array<{ method: string; url: string; body?: unknown }> = [];
    server.use(
      http.post(
        apiUrl(`/project/${projectId}/environments`),
        async ({ request }) => {
          requests.push({
            method: request.method,
            url: new URL(request.url).pathname,
            body: await request.json(),
          });
          return HttpResponse.json(item);
        },
      ),
      http.patch(
        apiUrl(`/project/${projectId}/environments/${environmentId}`),
        async ({ request }) => {
          requests.push({
            method: request.method,
            url: new URL(request.url).pathname,
            body: await request.json(),
          });
          return HttpResponse.json(item);
        },
      ),
      http.delete(
        apiUrl(`/project/${projectId}/environments/${environmentId}`),
        ({ request }) => {
          requests.push({
            method: request.method,
            url: new URL(request.url).pathname,
          });
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );
    await createProjectEnvironment(projectId, {
      name: "Local",
      category: "LOCAL",
    });
    await updateProjectEnvironment(projectId, environmentId, { runtime: null });
    await deleteProjectEnvironment(projectId, environmentId);
    expect(requests).toEqual([
      {
        method: "POST",
        url: `/api/project/${projectId}/environments`,
        body: { name: "Local", category: "LOCAL" },
      },
      {
        method: "PATCH",
        url: `/api/project/${projectId}/environments/${environmentId}`,
        body: { runtime: null },
      },
      {
        method: "DELETE",
        url: `/api/project/${projectId}/environments/${environmentId}`,
      },
    ]);
  });
});
