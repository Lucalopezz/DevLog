import { cn } from "@/lib/utils";
import type { Tag } from "../types/tag";

type TagBadgeProps = {
  tag: Pick<Tag, "name">;
  className?: string;
};

/**
 * Shared visual representation of a tag.
 *
 * Keeping this component presentational makes it safe to reuse in entry cards,
 * entry details, filters, and the tag-management page without coupling those
 * places to API or mutation logic.
 */
export function TagBadge({ tag, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground",
        className,
      )}
      title={`Tag: ${tag.name}`}
    >
      #{tag.name}
    </span>
  );
}
