# Casos de uso da API DevLog

Esta é a documentação comportamental **as is** da API no commit `96ba26e`,
analisada em 2 de setembro de 2026. Ela descreve o que o código executa hoje,
sem transformar backlog ou intenção futura em requisito implementado.

## Como ler

Cada caso segue o formato completo usado na disciplina: ator principal,
interesses, pré-condições, gatilho, pós-condições, fluxo principal e fluxos
alternativos. O endpoint aparece apenas como rastreabilidade; os passos evitam
detalhes de implementação porque um caso de uso descreve **o que** acontece.

Os documentos estão divididos por área:

- [Conta, autenticação e tags](account-and-tags.md)
- [Projetos, tecnologias, comandos e recursos](projects.md)
- [Registros técnicos, classificações e tentativas](technical-entries.md)
- [Matriz endpoint → caso de uso](traceability.md)
- [Especificação histórica/planejada](cases.md)

Os diagramas relacionados ficam no [índice de diagramas](../diagrams/README.md).

## Atores

| Ator                | Tipo                                  | Responsabilidade                           |
| ------------------- | ------------------------------------- | ------------------------------------------ |
| Visitante           | Primário                              | Cria uma conta ou inicia uma sessão.       |
| Usuário autenticado | Primário; especialização de Visitante | Gerencia exclusivamente os próprios dados. |

Não há ator secundário externo no código atual. Banco de dados, controllers,
casos de uso e provedores de JWT/hash são partes internas da API, portanto não
são atores no diagrama de casos de uso.

## Regras transversais comprovadas

1. Todo endpoint protegido exige um JWT válido no cookie HttpOnly
   `access_token`.
2. Recursos de outro usuário são respondidos como “não encontrados”. Além de
   impedir acesso, isso evita confirmar que o recurso alheio existe.
3. Parâmetros identificadores são UUIDs; corpos e consultas rejeitam campos não
   declarados e dados inválidos com status `422`.
4. Listagens são paginadas e possuem ordenação e filtros próprios.
5. Exclusões retornam sucesso sem conteúdo quando concluídas.
6. `null` remove associações ou valores opcionais apenas nos campos cujo
   contrato aceita remoção; campo ausente preserva o valor atual.

## Vocabulário do domínio

| Termo                | Significado                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Projeto              | Contexto de desenvolvimento ao qual registros, tecnologias, comandos e recursos podem pertencer. |
| Registro técnico     | Anotação do tipo problema (`ISSUE`) ou aprendizado (`LEARNING`).                                 |
| Tentativa de solução | Experimento documentado para um problema, com resultado `FAILED`, `PARTIAL` ou `SUCCESSFUL`.     |
| Tag                  | Classificação reutilizável e exclusiva do usuário.                                               |
| Arquivado            | Conteúdo retirado das consultas padrão, sem necessariamente ser excluído.                        |
| Resolvido            | Estado derivado de `resolvedAt` e aplicável somente a problemas.                                 |

## Decisões de modelagem

- Autenticação da requisição não foi modelada como `<<include>>` em dezenas de
  casos. O ator especializado “Usuário autenticado” comunica a mesma
  pré-condição e mantém o diagrama legível.
- Tecnologias, comandos e recursos são tratados como partes do projeto: são
  criados dentro dele e são removidos em cascata quando o projeto é excluído.
- Tentativas são partes de um registro técnico e também têm ciclo de vida
  dependente dele.
- A ligação entre registro e tag possui informação própria (`createdAt`), por
  isso aparece no diagrama de classes como tipo associativo.
- A ligação projeto–registro é uma associação opcional, e não composição: ao
  excluir o projeto, o registro é preservado e apenas perde a referência.

## Pontos de atenção encontrados no código atual

Estes itens não foram “corrigidos” nos modelos; estão documentados para que o
diagrama permaneça fiel à implementação:

- O domínio chama o estado intermediário de projeto de `INACTIVE`, enquanto o
  banco o armazena como `PAUSED`. Um mapper traduz explicitamente os valores.
- Projetos arquivados são somente leitura para suas informações, tecnologias,
  comandos e recursos. Registros técnicos arquivados, porém, ainda podem ser
  atualizados, resolvidos, reabertos, classificados, ter tentativas existentes
  alteradas/removidas e ser excluídos. Apenas a inclusão de nova tentativa
  bloqueia explicitamente registro arquivado.
- Não existe operação para restaurar um registro técnico arquivado.
- O logout remove o cookie local, mas não existe revogação de token no servidor.
- A API permite informar `conclusion` ao criar/editar um `LEARNING`; o domínio
  só proíbe `resolvedAt` nesse tipo. “Conclusão” e “resolução” não são sinônimos
  na implementação.
- O resultado de uma tentativa pode ser definido na criação, mas a atualização
  pública altera somente sua descrição.
- A busca de registros omite arquivados por padrão; a busca de projetos só
  filtra arquivamento quando o parâmetro é enviado.

Esses pontos são candidatos naturais a decisões de produto ou testes de
caracterização antes de futuras alterações.
