import { useQuery } from "@tanstack/react-query";
import {
  listProjectCommands,
  listProjectResources,
  listProjectTechnicalEntries,
  projectDetailKeys,
} from "../api/list-project-details";

const projectDetailParams = {
  page: 1,
  perPage: 6,
} as const;

/**
 * Cada consulta usa uma chave própria porque as coleções têm ciclos de vida
 * diferentes. Assim, atualizar comandos não precisa invalidar tecnologias ou
 * entradas técnicas por acidente.
 */
export function useProjectTechnicalEntries(projectId: string, page = 1) {
  const params = { ...projectDetailParams, page };

  return useQuery({
    // A página faz parte da chave para que o React Query mantenha cada página
    // no cache e volte a ela sem misturar entradas de páginas diferentes.
    queryKey: projectDetailKeys.technicalEntries(projectId, params),
    queryFn: () => listProjectTechnicalEntries(projectId, params),
    // Evita uma chamada inválida durante a resolução dos parâmetros da rota.
    // Enable é false quando projectId é uma string vazia, null ou undefined
    enabled: Boolean(projectId),
    retry: false,
  });
}

export function useProjectCommands(projectId: string, page = 1) {
  const params = { ...projectDetailParams, page };

  return useQuery({
    // Comandos usam uma chave própria para serem invalidados sem afetar as
    // outras coleções do projeto.
    queryKey: projectDetailKeys.commands(projectId, params),
    queryFn: () => listProjectCommands(projectId, params),
    enabled: Boolean(projectId),
    retry: false,
  });
}

export function useProjectResources(projectId: string, page = 1) {
  const params = { ...projectDetailParams, page };

  return useQuery({
    // A mesma estratégia é repetida para recursos, mantendo o hook simples e
    // deixando a coordenação entre API, cache e componente explícita.
    queryKey: projectDetailKeys.resources(projectId, params),
    queryFn: () => listProjectResources(projectId, params),
    enabled: Boolean(projectId),
    retry: false,
  });
}
