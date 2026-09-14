export function TagListSkeleton() {
  return (
    <section
      aria-label="Loading tags"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="h-16 animate-pulse rounded-xl border bg-muted/40"
          key={index}
        />
      ))}
    </section>
  );
}
