import { presentProjectStatus } from '../presentation';
import type { Project } from '../types/project';
import { formatDate } from '@/lib/date';

type ProjectListProps = {
  projects: Project[];
};

export function ProjectList({ projects }: ProjectListProps) {
  return (
    <section aria-labelledby="projects-list-title" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold" id="projects-list-title">
          Seus projetos
        </h2>
        <p className="text-sm text-muted-foreground">
          Projetos não arquivados ordenados pelos mais recentes.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => {
          const status = presentProjectStatus(project.status);

          return (
            <li key={project.id}>
              <article className="flex h-full flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm">
                <header className="flex items-start justify-between gap-4">
                  <h3 className="min-w-0 text-lg font-semibold break-words">
                    {project.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </header>

                {project.description ? (
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Sem descrição.
                  </p>
                )}

                <dl className="mt-auto space-y-2 border-t pt-4 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">Atualizado</dt>
                    <dd>
                      <time dateTime={project.updatedAt}>
                        {formatDate(project.updatedAt)}
                      </time>
                    </dd>
                  </div>

                  {project.localPath ? (
                    <div className="space-y-1">
                      <dt className="text-muted-foreground">Caminho local</dt>
                      <dd className="truncate font-mono text-xs" title={project.localPath}>
                        {project.localPath}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
