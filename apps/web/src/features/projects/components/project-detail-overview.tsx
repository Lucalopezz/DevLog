import { BookOpenText, Boxes, CircleDot, Code2, ExternalLink } from "lucide-react";
import { formatRelativeDate } from "@/lib/date";
import { presentProjectStatus } from "../presentation";
import type { Project } from "../types/project";

type ProjectDetailOverviewProps = {
  project: Project;
  technicalEntriesTotal?: number;
  commandsTotal?: number;
  resourcesTotal?: number;
};

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Boxes;
  label: string;
  value?: number;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-4">
      <Icon className="mb-5 size-5 text-primary" />
      <p className="text-2xl font-semibold tracking-tight">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function ProjectDetailOverview({
  project,
  technicalEntriesTotal,
  commandsTotal,
  resourcesTotal,
}: ProjectDetailOverviewProps) {
  const status = presentProjectStatus(project.status);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <BookOpenText className="size-5 text-primary" />
            </span>
            <div>
              <h2 className="font-semibold">Sobre o projeto</h2>
              <p className="text-sm text-muted-foreground">Contexto para voltar ao trabalho</p>
            </div>
          </div>

          <p className="max-w-2xl whitespace-pre-wrap text-sm leading-7 text-card-foreground/80">
            {project.description || "Este projeto ainda não possui uma descrição."}
          </p>

          <dl className="mt-8 grid gap-4 border-t border-border/60 pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Status atual</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium">
                <CircleDot className="size-4 text-primary" />
                <span className={status.className.split(" ")[1]}>{status.label}</span>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Última atualização</dt>
              <dd className="mt-1 font-medium">
                <time dateTime={project.updatedAt}>{formatRelativeDate(project.updatedAt)}</time>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Code2 className="size-5 text-primary" />
            </span>
            <div>
              <h2 className="font-semibold">Tecnologias</h2>
              <p className="text-sm text-muted-foreground">Stack registrada</p>
            </div>
          </div>

          {project.technologies?.length ? (
            <ul className="flex flex-wrap gap-2">
              {project.technologies.map((technology) => (
                <li
                  className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm"
                  key={technology.id}
                >
                  <span className="font-medium">{technology.name}</span>
                  {technology.version ? (
                    <span className="ml-1.5 text-muted-foreground">{technology.version}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              Nenhuma tecnologia foi registrada ainda.
            </p>
          )}
        </section>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {/* Os totais vêm de meta.total, não do tamanho da página atual. Assim
            o resumo continua correto mesmo quando a coleção é paginada. */}
        <Metric icon={Boxes} label="Entradas técnicas" value={technicalEntriesTotal} />
        <Metric icon={Code2} label="Comandos" value={commandsTotal} />
        <Metric icon={ExternalLink} label="Recursos" value={resourcesTotal} />
      </section>
    </div>
  );
}
