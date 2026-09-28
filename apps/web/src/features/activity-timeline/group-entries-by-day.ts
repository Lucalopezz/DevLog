import { format } from "date-fns";
import type { TechnicalEntry } from "@/features/technical-entry/types/technical-entry";

export type TimelineDay = {
  date: string;
  entries: TechnicalEntry[];
};

/** Groups an API-ordered collection without changing its newest-first order. */
export function groupEntriesByDay(
  entries: readonly TechnicalEntry[],
): TimelineDay[] {
  const days = new Map<string, TimelineDay>();
  const seen = new Set<string>();

  for (const entry of entries) {
    // Offset pagination can repeat an entry if new records shift a later page.
    // Keep its first occurrence, but do not pretend this is a fixed snapshot.
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);

    // toISOString().slice(0, 10) would group by UTC. Local date components
    // keep the heading consistent with the time shown in the user's browser.
    const date = format(new Date(entry.createdAt), "yyyy-MM-dd");
    // If the day already exists, append to its entries; otherwise, create a new day.
    const day = days.get(date) ?? { date, entries: [] };
    day.entries.push(entry);
    days.set(date, day);
  }

  return [...days.values()];
}
// The retur is something like this:
//  date: '2023-01-01', entries: [entry1, entry2]
