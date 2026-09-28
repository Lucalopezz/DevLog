import { describe, expect, it } from "vitest";
import { createTechnicalEntry } from "@/test/factories/technical-entry";
import { groupEntriesByDay } from "./group-entries-by-day";

describe("groupEntriesByDay", () => {
  it("separates local midnight and preserves the API order without mutating entries", () => {
    const entries = [
      createTechnicalEntry({
        id: "newest",
        createdAt: new Date(2026, 8, 27, 0, 1).toISOString(),
      }),
      createTechnicalEntry({
        id: "older",
        createdAt: new Date(2026, 8, 26, 23, 59).toISOString(),
      }),
      createTechnicalEntry({
        id: "oldest",
        createdAt: new Date(2026, 8, 26, 12).toISOString(),
      }),
    ];
    const original = structuredClone(entries);

    expect(groupEntriesByDay(entries)).toEqual([
      { date: "2026-09-27", entries: [entries[0]] },
      { date: "2026-09-26", entries: [entries[1], entries[2]] },
    ]);
    expect(entries).toEqual(original);
  });

  it("groups the same day across pages and ignores repeated IDs from shifted pages", () => {
    const entry = createTechnicalEntry();
    const older = createTechnicalEntry({
      id: "older",
      createdAt: "2026-09-14T10:00:00Z",
    });
    const pages = [[entry], [entry, older]];

    expect(groupEntriesByDay(pages.flat())).toEqual([
      { date: "2026-09-14", entries: [entry, older] },
    ]);
    expect(groupEntriesByDay([])).toEqual([]);
  });
});
