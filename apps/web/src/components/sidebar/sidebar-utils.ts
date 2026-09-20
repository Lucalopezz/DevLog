import type { Location } from "react-router";
import type { SidebarRouteItem } from "./sidebar-types";

type TechnicalEntryFilters = {
  type?: "ISSUE" | "LEARNING";
  status?: "OPEN" | "RESOLVED";
};

const TECHNICAL_ENTRY_FILTER_KEYS = ["type", "status"] as const;
const SIDEBAR_ROUTE_BASE_URL = "http://sidebar.local";

/**
 * Match only the journal's category filters. Other search fields, such as
 * title and tag, refine the list without changing which sidebar category owns it.
 */
export function matchTechnicalEntries(filters: TechnicalEntryFilters = {}) {
  return (location: Location) => {
    if (location.pathname !== "/technical-entries") return false;

    const params = new URLSearchParams(location.search);
    return TECHNICAL_ENTRY_FILTER_KEYS.every((key) => {
      const expectedValue = filters[key];
      // Unspecified category filters must be absent to keep categories exclusive.
      return expectedValue === undefined
        ? !params.has(key)
        : params.get(key) === expectedValue;
    });
  };
}

/** Match a route's pathname, using exact matching for `end` routes. */
export function matchesSidebarPathname(
  to: string,
  location: Location,
  end = false,
) {
  // URL separates a route's path from its search string without mixing query
  // parsing into the rendering component.
  const pathname = new URL(to, SIDEBAR_ROUTE_BASE_URL).pathname;

  return end
    ? location.pathname === pathname
    : location.pathname === pathname ||
        location.pathname.startsWith(`${pathname}/`);
}

export function isSidebarRouteActive(
  item: SidebarRouteItem,
  location: Location,
) {
  return item.match
    ? item.match(location)
    : matchesSidebarPathname(item.to, location, item.end);
}
