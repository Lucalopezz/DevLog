/**
 * Metadados compartilhados pelas respostas paginadas da API.
 *
 * O tipo fica próximo da infraestrutura HTTP porque não pertence a um domínio
 * específico: Projects, Tags e Technical Entries podem reutilizá-lo.
 */
export type Meta = {
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
};

export type Pagination<T> = {
  data: T[];
  meta: Meta;
};
