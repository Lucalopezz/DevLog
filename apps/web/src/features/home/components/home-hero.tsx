import { ArrowRight, BookOpenText, Lightbulb } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

type HomeHeroProps = {
  userName?: string;
};

export function HomeHero({ userName }: HomeHeroProps) {
  const firstName = userName?.trim().split(/\s+/)[0] || "developer";
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <section className="relative isolate overflow-hidden rounded-3xl border bg-zinc-950 px-6 py-8 text-zinc-50 shadow-xl shadow-black/5 sm:px-10 sm:py-10">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-32 -z-10 size-96 rounded-full bg-emerald-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-44 left-1/3 -z-10 size-80 rounded-full bg-cyan-400/10 blur-3xl"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
        <div className="max-w-2xl space-y-5">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0.75rem] shadow-emerald-400/70" />
            {today}
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Welcome back, {firstName}.
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
              Keep the context behind your code. Revisit active work, capture a
              discovery, or close an issue while the details are still fresh.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
              size="lg"
            >
              <Link to="/technical-entries">
                <BookOpenText data-icon="inline-start" />
                Open journal
              </Link>
            </Button>
            <Button
              asChild
              className="border-zinc-700 bg-zinc-900/60 text-zinc-100 hover:bg-zinc-800 hover:text-white dark:bg-zinc-900/60"
              size="lg"
              variant="outline"
            >
              <Link to="/projects">
                View projects
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-300 text-amber-950">
              <Lightbulb aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Make knowledge reusable</p>
              <p className="text-xs text-zinc-400">
                A note now saves a search later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
