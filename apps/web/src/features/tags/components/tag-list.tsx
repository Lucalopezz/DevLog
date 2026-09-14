import { TagBadge } from "./tag-badge";
import { TagDeleteButton } from "./tag-delete-button";
import type { Tag } from "../types/tag";

type TagListProps = {
  deletingTagId?: string;
  onDelete: (tagId: string) => Promise<void>;
  tags: Tag[];
};

export function TagList({
  deletingTagId,
  onDelete,
  tags,
}: TagListProps) {
  return (
    <section aria-labelledby="tags-list-title" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold" id="tags-list-title">
          Your tags
        </h2>
        <p className="text-sm text-muted-foreground">
          Reusable classifications for your technical entries.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <li key={tag.id}>
            <article className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <TagBadge tag={tag} />
              <TagDeleteButton
                isPending={deletingTagId === tag.id}
                onDelete={() => onDelete(tag.id)}
                tag={tag}
              />
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
