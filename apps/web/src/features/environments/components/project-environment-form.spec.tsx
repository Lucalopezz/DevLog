import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";
import { ProjectEnvironmentForm } from "./project-environment-form";
import { environmentKeys } from "../api/environment-api";
import type { ProjectEnvironment } from "../types/environment";

const projectId = "123e4567-e89b-42d3-a456-426614174002";
const response = {
  id: "123e4567-e89b-42d3-a456-426614174003",
  projectId,
  projectName: "DevLog",
  name: "Local development",
  category: "LOCAL",
  operatingSystem: null,
  runtime: null,
  runtimeVersion: null,
  description: null,
  createdAt: "2026-09-25T18:00:00.000Z",
  updatedAt: "2026-09-25T18:00:00.000Z",
};

describe("ProjectEnvironmentForm", () => {
  it("validates an empty name without sending a request", async () => {
    const post = vi.fn();
    server.use(
      http.post(apiUrl(`/project/${projectId}/environments`), () => {
        post();
        return HttpResponse.json(response);
      }),
    );
    const { user } = renderWithProviders(
      <ProjectEnvironmentForm
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        open
        projectId={projectId}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "New environment" });
    await user.click(
      within(dialog).getByRole("button", { name: "Create environment" }),
    );
    expect(
      await within(dialog).findByText(
        "Name must be at least 2 characters long.",
      ),
    ).toBeVisible();
    expect(post).not.toHaveBeenCalled();
  });
  it("submits the mapped fields and closes on success", async () => {
    let body: unknown;
    server.use(
      http.post(
        apiUrl(`/project/${projectId}/environments`),
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(response);
        },
      ),
    );
    const onOpenChange = vi.fn();
    const { user, client } = renderWithProviders(
      <ProjectEnvironmentForm
        onOpenChange={onOpenChange}
        onSaved={vi.fn()}
        open
        projectId={projectId}
      />,
    );
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const dialog = screen.getByRole("dialog", { name: "New environment" });
    await user.type(
      within(dialog).getByRole("textbox", { name: "Name" }),
      "Local development",
    );
    await user.type(
      within(dialog).getByRole("textbox", { name: "Operating system" }),
      "Ubuntu 24.04",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create environment" }),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(body).toMatchObject({
      name: "Local development",
      category: "LOCAL",
      operatingSystem: "Ubuntu 24.04",
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: environmentKeys.project(projectId),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: environmentKeys.lists(),
    });
  });
  it("keeps the draft after an API error", async () => {
    let attempts = 0;
    server.use(
      http.post(apiUrl(`/project/${projectId}/environments`), () => {
        attempts += 1;
        return HttpResponse.json({ message: "Conflict" }, { status: 409 });
      }),
    );
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ProjectEnvironmentForm
        onOpenChange={onOpenChange}
        onSaved={vi.fn()}
        open
        projectId={projectId}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "New environment" });
    await user.type(
      within(dialog).getByRole("textbox", { name: "Name" }),
      "Local development",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create environment" }),
    );
    await waitFor(() => expect(attempts).toBe(1));
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Create environment" }),
      ).toBeEnabled(),
    );
    expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue(
      "Local development",
    );
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("pre-populates an edit and clears an optional field with null", async () => {
    let body: unknown;
    server.use(
      http.patch(
        apiUrl(`/project/${projectId}/environments/${response.id}`),
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ ...response, runtime: null });
        },
      ),
    );
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ProjectEnvironmentForm
        environment={{ ...response, runtime: "Node.js" } as ProjectEnvironment}
        onOpenChange={onOpenChange}
        onSaved={vi.fn()}
        open
        projectId={projectId}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "Edit environment" });
    const runtime = within(dialog).getByRole("textbox", { name: "Runtime" });
    expect(runtime).toHaveValue("Node.js");
    await user.clear(runtime);
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(body).toMatchObject({ runtime: null, name: response.name });
  });
});
