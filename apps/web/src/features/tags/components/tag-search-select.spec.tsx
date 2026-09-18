import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { createTag } from "@/test/factories/tag";
import { renderWithProviders } from "@/test/render-with-providers";
import { apiUrl } from "@/test/mocks/urls";
import { server } from "@/test/mocks/server";
import { TagSearchSelect } from "./tag-search-select";

describe("TagSearchSelect", () => {
  it("does not load the tag library before the user searches", async () => {
    const requests: URL[] = [];
    const reactTag = createTag();

    server.use(
      http.get(apiUrl("/tag"), ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({
          data: [reactTag],
          meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
        });
      }),
    );

    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <TagSearchSelect onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "All tags" }));
    expect(requests).toHaveLength(0);

    const searchInput = screen.getByRole("combobox", { name: "Search tags" });
    await user.type(searchInput, "r");

    // A one-character term is intentionally not sent because it is usually
    // too broad for a large tag library.
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(requests).toHaveLength(0);

    await user.type(searchInput, "e");
    await waitFor(() => expect(requests).toHaveLength(1));

    expect(requests[0].searchParams.get("name")).toBe("re");
    expect(requests[0].searchParams.get("perPage")).toBe("10");
  });

  it("returns the selected tag and closes the dropdown", async () => {
    const reactTag = createTag();
    server.use(
      http.get(apiUrl("/tag"), () =>
        HttpResponse.json({
          data: [reactTag],
          meta: { currentPage: 1, perPage: 10, lastPage: 1, total: 1 },
        }),
      ),
    );

    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <TagSearchSelect onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "All tags" }));
    await user.type(
      screen.getByRole("combobox", { name: "Search tags" }),
      "re",
    );

    await user.click(await screen.findByRole("option", { name: "#React" }));

    expect(onChange).toHaveBeenCalledWith({
      id: reactTag.id,
      name: reactTag.name,
    });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
