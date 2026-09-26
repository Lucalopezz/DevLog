import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { Route, Routes, useLocation } from "react-router";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";
import EnvironmentsPage from "./environments-page";

const projectId = "123e4567-e89b-42d3-a456-426614174002";
const environment = {
  id: "123e4567-e89b-42d3-a456-426614174003",
  projectId,
  projectName: "DevLog",
  name: "Production",
  category: "PRODUCTION",
  operatingSystem: "Ubuntu 24.04",
  runtime: "Node.js",
  runtimeVersion: "22",
  description: null,
  createdAt: "2026-09-25T18:00:00.000Z",
  updatedAt: "2026-09-25T18:00:00.000Z",
};
const meta = { currentPage: 1, perPage: 20, lastPage: 1, total: 1 };
function Location() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}
function renderPage(route = "/environments") {
  return renderWithProviders(
    <Routes>
      <Route
        path="/environments"
        element={
          <>
            <EnvironmentsPage />
            <Location />
          </>
        }
      />
    </Routes>,
    { route },
  );
}
function installHandlers() {
  server.use(
    http.get(apiUrl("/project"), () =>
      HttpResponse.json({
        data: [{ id: projectId, name: "DevLog" }],
        meta: { currentPage: 1, perPage: 1000, lastPage: 1, total: 1 },
      }),
    ),
    http.get(apiUrl("/project/environments"), () =>
      HttpResponse.json({ data: [environment], meta }),
    ),
  );
}
describe("EnvironmentsPage", () => {
  it("groups results by project and links to its detail", async () => {
    installHandlers();
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Production" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "DevLog" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Open project" })).toHaveAttribute(
      "href",
      `/projects/${projectId}`,
    );
  });
  it("restores direct URL filters and resets pagination on change", async () => {
    let received = "";
    installHandlers();
    server.use(
      http.get(apiUrl("/project/environments"), ({ request }) => {
        received = new URL(request.url).search;
        return HttpResponse.json({ data: [environment], meta });
      }),
    );
    const { user } = renderPage(
      `/environments?category=PRODUCTION&projectId=${projectId}&page=2`,
    );
    await screen.findByRole("heading", { name: "Production" });
    expect(received).toContain("category=PRODUCTION");
    expect(received).toContain(`projectId=${projectId}`);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Category" }),
      "LOCAL",
    );
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "category=LOCAL",
      ),
    );
    expect(screen.getByTestId("location")).toHaveTextContent("page=1");
  });
  it("shows an empty-account state", async () => {
    installHandlers();
    server.use(
      http.get(apiUrl("/project/environments"), () =>
        HttpResponse.json({
          data: [],
          meta: { currentPage: 1, perPage: 20, lastPage: 0, total: 0 },
        }),
      ),
    );
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "No environments yet" }),
    ).toBeVisible();
  });

  it("recovers from a direct URL beyond the last page", async () => {
    installHandlers();
    server.use(
      http.get(apiUrl("/project/environments"), () =>
        HttpResponse.json({
          data: [],
          meta: { currentPage: 99, perPage: 20, lastPage: 1, total: 1 },
        }),
      ),
    );
    const { user } = renderPage("/environments?page=99");
    expect(
      await screen.findByRole("heading", {
        name: "No environments on this page",
      }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Go to first page" }));
    expect(screen.getByTestId("location")).toHaveTextContent("page=1");
  });

  it("offers projects from later pages in the project filter", async () => {
    installHandlers();
    const pages: number[] = [];
    server.use(
      http.get(apiUrl("/project"), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page"));
        pages.push(page);
        return HttpResponse.json({
          data: page === 1 ? [{ id: "first", name: "First project" }] : [{ id: projectId, name: "DevLog" }],
          meta: { currentPage: page, perPage: 100, lastPage: 2, total: 2 },
        });
      }),
    );
    renderPage();
    expect(await screen.findByRole("option", { name: "DevLog" })).toBeVisible();
    expect(pages).toEqual([1, 2]);
  });

  it("offers a retry when the global search fails", async () => {
    installHandlers();
    server.use(
      http.get(apiUrl("/project/environments"), () =>
        HttpResponse.json({ message: "Unavailable" }, { status: 500 }),
      ),
    );
    renderPage();
    const alert = await screen.findByRole("alert", {
      name: "Could not load environments",
    });
    expect(alert).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("formats the result count using en-US", async () => {
    installHandlers();
    server.use(
      http.get(apiUrl("/project/environments"), () =>
        HttpResponse.json({ data: [environment], meta: { ...meta, total: 1234, lastPage: 62 } }),
      ),
    );
    renderPage();
    expect(await screen.findByText(/1,234 environment\(s\)/)).toBeVisible();
  });
});
