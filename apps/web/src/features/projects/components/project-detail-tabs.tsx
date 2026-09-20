import type { KeyboardEvent, ReactNode } from "react";

export type ProjectDetailTab =
  | "overview"
  | "entries"
  | "technologies"
  | "commands"
  | "resources"
  | "settings";

export const projectDetailTabs: { id: ProjectDetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "entries", label: "Technical entries" },
  { id: "technologies", label: "Technologies" },
  { id: "commands", label: "Commands" },
  { id: "resources", label: "Resources" },
  { id: "settings", label: "Settings" },
];

export function ProjectDetailTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: ProjectDetailTab;
  onTabChange: (tab: ProjectDetailTab) => void;
}) {
  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    // These queries already run in parallel, so arrow-key activation never
    // waits for a new request before switching the visible panel.
    let nextIndex: number;
    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % projectDetailTabs.length;
        break;
      case "ArrowLeft":
        nextIndex =
          (index - 1 + projectDetailTabs.length) % projectDetailTabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = projectDetailTabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = projectDetailTabs[nextIndex];
    onTabChange(nextTab.id);
    const tabButtons = event.currentTarget
      .closest('[role="tablist"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabButtons?.[nextIndex]?.focus();
  }

  return (
    // ARIA roles expose the relationship between each tab and its panel.
    <nav
      aria-label="Project sections"
      className="overflow-x-auto border-b border-border/60"
    >
      <div className="flex min-w-max gap-1" role="tablist">
        {projectDetailTabs.map((tab, index) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              aria-controls={`project-panel-${tab.id}`}
              aria-selected={isActive}
              className={`relative rounded-t-lg px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                isActive
                  ? "text-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              id={`project-tab-${tab.id}`}
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function ProjectDetailTabPanel({
  activeTab,
  children,
  id,
}: {
  activeTab: ProjectDetailTab;
  children: ReactNode;
  id: ProjectDetailTab;
}) {
  const isActive = activeTab === id;

  return (
    <section
      aria-labelledby={`project-tab-${id}`}
      hidden={!isActive}
      id={`project-panel-${id}`}
      role="tabpanel"
      tabIndex={0}
    >
      {isActive ? children : null}
    </section>
  );
}
