import type { ProjectStatus } from './types/project';

export type ProjectStatusPresentation = {
  label: string;
  className: string;
};

/**
 * Traduz valores do domínio para decisões visuais da interface.
 *
 * A API continua trabalhando com ACTIVE, INACTIVE e FINISHED. O componente
 * não precisa conhecer esses detalhes nem espalhar condicionais pela tela;
 * ele consulta este mapa e recebe o texto e as classes prontas para exibição.
 */
export const projectStatusPresentation: Record<
  ProjectStatus,
  ProjectStatusPresentation
> = {
  ACTIVE: {
    label: 'Ativo',
    className:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  INACTIVE: {
    label: 'Inativo',
    className: 'bg-muted text-muted-foreground',
  },
  FINISHED: {
    label: 'Finalizado',
    className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
};
/**
 *Recebe um status de projeto e retorna o texto e as classes CSS para exibição.
 * */
export function presentProjectStatus(
  status: ProjectStatus,
): ProjectStatusPresentation {
  return projectStatusPresentation[status];
}
