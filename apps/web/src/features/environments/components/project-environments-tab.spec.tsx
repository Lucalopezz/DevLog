import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { createProjectFixture } from "@/test/factories/project";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";
import ProjectDetailPage from "@/features/projects/pages/project-detail-page";

const project = createProjectFixture();
const environment = {
  id: "123e4567-e89b-42d3-a456-426614174003",
  projectId: project.id,
  projectName: project.name,
  name: "Local development",
  category: "LOCAL",
  operatingSystem: "Ubuntu",
  runtime: "Node.js",
  runtimeVersion: "22",
  description: null,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
};
function handlers(archived = false) {
  server.use(
    http.get(apiUrl("/tag"), () =>
      HttpResponse.json({
        data: [],
        meta: { currentPage: 1, perPage: 100, lastPage: 0, total: 0 },
      }),
    ),
    http.get(apiUrl(`/project/${project.id}`), () =>
      HttpResponse.json({
        ...project,
        archivedAt: archived ? project.updatedAt : undefined,
      }),
    ),
    http.get(apiUrl(`/project/${project.id}/technical-entries`), () =>
      HttpResponse.json({
        data: [],
        meta: { currentPage: 1, perPage: 6, lastPage: 0, total: 0 },
      }),
    ),
    http.get(apiUrl(`/project/${project.id}/commands`), () =>
      HttpResponse.json({
        data: [],
        meta: { currentPage: 1, perPage: 6, lastPage: 0, total: 0 },
      }),
    ),
    http.get(apiUrl(`/project/${project.id}/resources`), () =>
      HttpResponse.json({
        data: [],
        meta: { currentPage: 1, perPage: 6, lastPage: 0, total: 0 },
      }),
    ),
    http.get(apiUrl(`/project/${project.id}/environments`), () =>
      HttpResponse.json({
        data: [environment],
        meta: { currentPage: 1, perPage: 6, lastPage: 1, total: 1 },
      }),
    ),
  );
}
function renderDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
    </Routes>,
    { route: `/projects/${project.id}` },
  );
}
describe("project environment tab", () => {
  it("opens by keyboard and displays the project environments", async () => {
    handlers();
    const { user } = renderDetail();
    await screen.findByRole("heading", { name: project.name });
    const technologies = screen.getByRole("tab", { name: "Technologies" });
    technologies.focus();
    await user.keyboard("{ArrowRight}");
    const panel = await screen.findByRole("tabpanel", { name: "Environments" });
    expect(within(panel).getByText("Local development")).toBeVisible();
    expect(within(panel).getByText("Ubuntu · Node.js 22")).toBeVisible();
  });
  it("disables mutation controls for an archived project", async () => {
    handlers(true);
    const { user } = renderDetail();
    await screen.findByRole("heading", { name: project.name });
    await user.click(screen.getByRole("tab", { name: "Environments" }));
    const panel = await screen.findByRole("tabpanel", { name: "Environments" });
    expect(
      within(panel).getByRole("button", { name: "New environment" }),
    ).toBeDisabled();
    expect(
      within(panel).getByRole("button", { name: `Edit ${environment.name}` }),
    ).toBeDisabled();
    expect(
      within(panel).getByRole("button", { name: `Delete ${environment.name}` }),
    ).toBeDisabled();
  });
});
