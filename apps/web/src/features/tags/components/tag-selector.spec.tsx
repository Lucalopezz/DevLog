import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { createTag } from "@/test/factories/tag";
import { server } from "@/test/mocks/server";
import { apiUrl } from "@/test/mocks/urls";
import { renderWithProviders } from "@/test/render-with-providers";

import { TagSelector } from "./tag-selector";

const reactTag = createTag({
  id: "44444444-4444-4444-8444-444444444444",
  name: "React",
});
const dockerTag = createTag({
  id: "55555555-5555-4555-8555-555555555555",
  name: "Docker",
});

function collection(data: typeof reactTag[]) {
  return {
    data,
    meta: { currentPage: 1, perPage: 100, lastPage: 1, total: data.length },
  };
}

function installTagList() {
  server.use(
    http.get(apiUrl("/tag"), ({ request }) => {
      const name = new URL(request.url).searchParams.get("name")?.toLowerCase();
      const tags = [reactTag, dockerTag].filter(
        (tag) => !name || tag.name.toLowerCase().includes(name),
      );
      return HttpResponse.json(collection(tags));
    }),
  );
}

function ControlledTagSelector({ onChange }: { onChange?: (ids: string[]) => void }) {
  const [value, setValue] = useState<string[]>([]);

  function handleChange(ids: string[]) {
    setValue(ids);
    onChange?.(ids);
  }

  return <TagSelector onChange={handleChange} value={value} />;
}

describe("TagSelector", () => {
  it("adds and removes a selected tag ID", async () => {
    installTagList();
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <ControlledTagSelector onChange={onChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Choose tags" }));
    const picker = screen.getByRole("dialog", { name: "Select tags" });
    const reactButton = await within(picker).findByRole("button", {
      name: "#React",
    });

    await user.click(reactButton);
    expect(onChange).toHaveBeenLastCalledWith([reactTag.id]);
    expect(reactButton).toHaveAttribute("aria-pressed", "true");

    await user.click(reactButton);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("selects the tag returned after creating it", async () => {
    installTagList();
    const createdTag = createTag({
      id: "66666666-6666-4666-8666-666666666666",
      name: "TypeScript",
    });
    const onChange = vi.fn();
    server.use(
      http.post(apiUrl("/tag"), () =>
        HttpResponse.json(createdTag, { status: 201 }),
      ),
    );

    const { user } = renderWithProviders(
      <ControlledTagSelector onChange={onChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Choose tags" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Select tags" })).getByRole(
        "button",
        { name: "Create new tag" },
      ),
    );

    const createDialog = screen.getByRole("dialog", { name: "New tag" });
    await user.type(
      within(createDialog).getByRole("textbox", { name: "Name" }),
      createdTag.name,
    );
    await user.click(
      within(createDialog).getByRole("button", { name: "Create tag" }),
    );

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith([createdTag.id]),
    );
  });

  it("keeps selected tag details visible while searching", async () => {
    installTagList();
    const { user } = renderWithProviders(<ControlledTagSelector />);

    await user.click(screen.getByRole("button", { name: "Choose tags" }));
    let picker = screen.getByRole("dialog", { name: "Select tags" });
    await user.click(
      await within(picker).findByRole("button", { name: "#React" }),
    );
    await user.click(within(picker).getByRole("button", { name: "Close" }));

    expect(screen.getByText("#React")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Choose tags" }));
    picker = screen.getByRole("dialog", { name: "Select tags" });
    await user.type(
      within(picker).getByRole("textbox", { name: "Search tags" }),
      "docker",
    );

    expect(screen.getByText("#React")).toBeVisible();
    expect(
      await within(picker).findByRole("button", { name: "#Docker" }),
    ).toBeVisible();
  });
});
