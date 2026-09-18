import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createTag } from "@/test/factories/tag";
import { createTechnicalEntry } from "@/test/factories/technical-entry";
import { deferred } from "@/test/deferred";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";

import { TechnicalEntryTagsEditor } from "./technical-entry-tags-editor";

const reactTag = createTag({
  id: "44444444-4444-4444-8444-444444444444",
  name: "React",
});

function installTagList() {
  server.use(
    http.get(apiUrl("/tag"), () =>
      HttpResponse.json({
        data: [reactTag],
        meta: { currentPage: 1, perPage: 100, lastPage: 1, total: 1 },
      }),
    ),
  );
}

describe("TechnicalEntryTagsEditor", () => {
  it("removes a tag through the relationship endpoint", async () => {
    installTagList();
    const entry = createTechnicalEntry({ tags: [reactTag] });
    let deleteCount = 0;

    server.use(
      http.delete(
        apiUrl(`/technical-entry/${entry.id}/tags/${reactTag.id}`),
        () => {
          deleteCount += 1;
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    const { user } = renderWithProviders(
      <TechnicalEntryTagsEditor entry={entry} />,
    );
    await screen.findByText("#React");
    await user.click(
      screen.getByRole("button", { name: "Remove React tag" }),
    );

    await waitFor(() => expect(deleteCount).toBe(1));
    expect(screen.queryByText("#React")).toBeNull();
  });

  it("disables the selector while assigning a relationship", async () => {
    installTagList();
    const entry = createTechnicalEntry({ tags: [] });
    const gate = deferred<void>();

    server.use(
      http.post(
        apiUrl(`/technical-entry/${entry.id}/tags`),
        async () => {
          await gate.promise;
          return HttpResponse.json(reactTag, { status: 201 });
        },
      ),
    );

    const { user } = renderWithProviders(
      <TechnicalEntryTagsEditor entry={entry} />,
    );
    await user.click(screen.getByRole("button", { name: "Choose tags" }));
    const picker = screen.getByRole("dialog", { name: "Select tags" });
    const reactButton = await within(picker).findByRole("button", {
      name: "#React",
    });
    await user.click(reactButton);

    await waitFor(() => expect(reactButton).toBeDisabled());
    expect(
      within(picker).getByRole("button", { name: "Create new tag" }),
    ).toBeDisabled();

    gate.resolve(undefined);
    await waitFor(() => expect(reactButton).toBeEnabled());
  });
});
