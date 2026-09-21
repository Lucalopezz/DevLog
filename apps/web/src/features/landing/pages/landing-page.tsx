import {
  ArrowRight,
  BookOpenText,
  Bug,
  CheckCircle2,
  Code2,
  FolderKanban,
  Lightbulb,
  Sparkles,
  Tags,
} from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FolderKanban,
    title: "Keep projects in context",
    description:
      "Bring notes, commands, useful links, and technologies together around the project where they belong.",
  },
  {
    icon: Bug,
    title: "Document the debugging path",
    description:
      "Record each solution attempt, what failed, and the conclusion that finally moved the work forward.",
  },
  {
    icon: Lightbulb,
    title: "Turn work into knowledge",
    description:
      "Capture lessons while the details are fresh, then find them later through tags and structured entries.",
  },
] as const;

const workflow = [
  {
    step: "01",
    title: "Capture",
    description: "Write down an issue, learning, command, or resource.",
  },
  {
    step: "02",
    title: "Connect",
    description: "Attach it to a project and organize it with tags.",
  },
  {
    step: "03",
    title: "Reuse",
    description:
      "Return to the reasoning instead of solving the same problem twice.",
  },
] as const;

/**
 * Public entry point for DevLog.
 *
 * This page intentionally has no session loader or authenticated hooks. Keeping
 * it outside the application layout means a visitor can understand the product
 * without making a private API request or briefly seeing workspace navigation.
 */
export default function LandingPage() {
  return (
    <div className="min-h-svh overflow-hidden bg-zinc-950 text-zinc-50">
      <header className="relative z-20 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        >
          <Link aria-label="DevLog home" className="shrink-0" to="/">
            <img
              alt="DevLog"
              className="h-14 w-auto object-contain sm:h-16"
              src="/logo_horizontal.png"
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              asChild
              className="text-zinc-300 hover:bg-white/10 hover:text-white"
              variant="ghost"
            >
              <Link to="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="bg-emerald-300 text-zinc-950 hover:bg-emerald-200"
            >
              <Link aria-label="Create account" to="/register">
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Create account</span>
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute left-1/2 top-0 size-128 -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="absolute right-0 top-80 size-96 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-14 px-6 pb-24 pt-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(32rem,1.1fr)] lg:items-center lg:px-8 lg:pb-32 lg:pt-28">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-sm font-medium text-emerald-200">
                <Sparkles aria-hidden="true" className="size-4" />
                Your development knowledge, organized
              </div>

              <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Keep the reasoning behind your code.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400 sm:text-xl">
                DevLog is a technical journal and project workspace for the
                issues you solve, the lessons you learn, and the context you do
                not want to lose.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="h-11 bg-emerald-300 px-5 text-zinc-950 hover:bg-emerald-200"
                  size="lg"
                >
                  <Link to="/register">
                    Start your DevLog
                    <ArrowRight aria-hidden="true" data-icon="inline-end" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-11 border-white/15 bg-white/5 px-5 text-zinc-100 hover:bg-white/10 hover:text-white"
                  size="lg"
                  variant="outline"
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>

              <p className="mt-5 flex items-center gap-2 text-sm text-zinc-500">
                <CheckCircle2
                  aria-hidden="true"
                  className="size-4 text-emerald-300"
                />
                Built for developers who learn by building.
              </p>
            </div>

            {/* This is an illustrative product preview, not a second interactive
                interface. Hiding its small decorative controls prevents screen
                readers from announcing actions that cannot be used. */}
            <div
              aria-label="DevLog workspace preview"
              className="relative mx-auto w-full max-w-2xl"
              role="img"
            >
              <div
                aria-hidden="true"
                className="absolute -inset-4 rounded-3xl bg-emerald-400/10 blur-2xl"
              />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/40">
                <div className="flex h-11 items-center gap-2 border-b border-white/10 px-4">
                  <span className="size-2.5 rounded-full bg-rose-400/80" />
                  <span className="size-2.5 rounded-full bg-amber-300/80" />
                  <span className="size-2.5 rounded-full bg-emerald-300/80" />
                  <span className="ml-3 font-mono text-xs text-zinc-500">
                    devlog / workspace
                  </span>
                </div>

                <div className="grid min-h-96 grid-cols-[4.5rem_1fr] sm:grid-cols-[11rem_1fr]">
                  <aside className="border-r border-white/10 bg-zinc-950/60 p-3 sm:p-4">
                    <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-zinc-200">
                      <Code2
                        aria-hidden="true"
                        className="size-5 text-emerald-300"
                      />
                      <span className="hidden sm:inline">Workspace</span>
                    </div>
                    <div className="space-y-2 text-xs text-zinc-500">
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-300/10 p-2 text-emerald-200">
                        <BookOpenText aria-hidden="true" className="size-4" />
                        <span className="hidden sm:inline">Journal</span>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <FolderKanban aria-hidden="true" className="size-4" />
                        <span className="hidden sm:inline">Projects</span>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <Tags aria-hidden="true" className="size-4" />
                        <span className="hidden sm:inline">Tags</span>
                      </div>
                    </div>
                  </aside>

                  <div className="min-w-0 p-4 sm:p-6">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                      Recent knowledge
                    </p>
                    <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                      Technical journal
                    </h2>

                    <div className="mt-6 space-y-3">
                      <article className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-rose-400/10 px-2 py-1 font-medium text-rose-300">
                            Open issue
                          </span>
                          <span className="text-zinc-500">API · 8 min ago</span>
                        </div>
                        <h3 className="mt-3 font-medium text-zinc-100">
                          Preserve cache consistency after mutations
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                          Track every query representation affected by the
                          update before invalidating the cache.
                        </p>
                      </article>

                      <article className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-amber-300/10 px-2 py-1 font-medium text-amber-200">
                            Learning
                          </span>
                          <span className="text-zinc-500">Web · Yesterday</span>
                        </div>
                        <h3 className="mt-3 font-medium text-zinc-100">
                          Route loaders keep access rules declarative
                        </h3>
                      </article>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-zinc-900/50 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                One place for the whole trail
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                More useful than a pile of disconnected notes.
              </h2>
              <p className="mt-4 text-lg leading-8 text-zinc-400">
                DevLog preserves both the answer and the path that led to it.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6"
                    key={feature.title}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 leading-7 text-zinc-400">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-24" id="how-it-works">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  A simple habit
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Build a memory for your work.
                </h2>
                <p className="mt-4 max-w-lg text-lg leading-8 text-zinc-400">
                  The goal is not more documentation. It is less time rebuilding
                  context you already earned.
                </p>
              </div>

              <ol className="grid gap-4 sm:grid-cols-3">
                {workflow.map((item) => (
                  <li
                    className="rounded-2xl border border-white/10 p-5"
                    key={item.step}
                  >
                    <span className="font-mono text-sm text-emerald-300">
                      {item.step}
                    </span>
                    <h3 className="mt-6 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-emerald-300/20 bg-emerald-300 px-6 py-14 text-center text-zinc-950 sm:px-12">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-24 size-72 rounded-full border border-zinc-950/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-28 -left-16 size-64 rounded-full border border-zinc-950/10"
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Your next breakthrough deserves a better place than memory.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-800">
                Start building a searchable record of what you solve and learn.
              </p>
              <Button
                asChild
                className="mt-8 h-11 bg-zinc-950 px-5 text-white hover:bg-zinc-800"
                size="lg"
              >
                <Link to="/register">
                  Create your account
                  <ArrowRight aria-hidden="true" data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>DevLog — log, learn, build.</p>
          <p>A focused knowledge workspace for software developers.</p>
        </div>
      </footer>
    </div>
  );
}
