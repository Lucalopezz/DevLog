# Casos de uso — projetos e seus detalhes

Os casos UC-10 a UC-29 são exclusivos do usuário autenticado. Sempre que um
projeto ou detalhe não existir, não pertencer ao usuário, ou não estiver dentro
do projeto indicado, a API responde como recurso não encontrado. Essa política
é repetida nos fluxos alternativos apenas quando muda o entendimento do caso.

## UC-10 — Criar projeto

| Campo          | Descrição                                                       |
| -------------- | --------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                             |
| Interesses     | Registrar um contexto de desenvolvimento próprio.               |
| Pré-condições  | Conta da sessão existente.                                      |
| Gatilho        | O usuário informa nome e descrição opcional.                    |
| Pós-condições  | Projeto ativo, não arquivado e pertencente ao usuário é criado. |
| Endpoint       | `POST /api/project`                                             |

### Fluxo principal

1. O usuário informa os dados do projeto.
2. O sistema valida os dados e confirma a existência do usuário.
3. O sistema cria o projeto com status `ACTIVE`.
4. O sistema apresenta o projeto criado.

### Fluxos alternativos

- Nome inválido, nome já usado pelo mesmo usuário ou conta inexistente impedem
  a criação.

## UC-11 — Pesquisar projetos

| Campo          | Descrição                                          |
| -------------- | -------------------------------------------------- |
| Ator principal | Usuário autenticado                                |
| Interesses     | Localizar somente os próprios projetos.            |
| Pré-condições  | Requisição autenticada.                            |
| Gatilho        | O usuário solicita projetos com filtros opcionais. |
| Pós-condições  | Nenhuma alteração de estado.                       |
| Endpoint       | `GET /api/project`                                 |

### Fluxo principal

1. O usuário informa paginação, ordenação e filtros opcionais de nome, status e
   arquivamento.
2. O sistema restringe a busca ao proprietário autenticado.
3. O sistema apresenta a página encontrada.

### Fluxos alternativos

- Sem correspondências, a página é vazia.
- Sem filtro de arquivamento, projetos arquivados e não arquivados podem
  aparecer.

## UC-12 — Consultar projeto

| Campo          | Descrição                                         |
| -------------- | ------------------------------------------------- |
| Ator principal | Usuário autenticado                               |
| Interesses     | Visualizar um projeto próprio e suas tecnologias. |
| Pré-condições  | O projeto pertence ao usuário.                    |
| Gatilho        | O usuário seleciona um projeto.                   |
| Pós-condições  | Nenhuma alteração de estado.                      |
| Endpoint       | `GET /api/project/:id`                            |

### Fluxo principal

1. O usuário indica o projeto.
2. O sistema confirma sua propriedade.
3. O sistema reúne as tecnologias do projeto.
4. O sistema apresenta o projeto e as tecnologias.

### Fluxos alternativos

- Projeto inexistente ou alheio é apresentado como não encontrado.
- Comandos, recursos e registros não fazem parte desta resposta; possuem
  consultas próprias.

## UC-13 — Pesquisar registros de um projeto

| Campo          | Descrição                                                         |
| -------------- | ----------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                               |
| Interesses     | Ver os registros técnicos relacionados a um projeto próprio.      |
| Pré-condições  | Projeto pertencente ao usuário.                                   |
| Gatilho        | O usuário solicita os registros do projeto com filtros opcionais. |
| Pós-condições  | Nenhuma alteração de estado.                                      |
| Endpoint       | `GET /api/project/:id/technical-entries`                          |

### Fluxo principal

1. O usuário indica o projeto e os critérios de pesquisa.
2. O sistema confirma a propriedade do projeto.
3. O sistema busca registros do usuário ligados ao projeto.
4. O sistema reúne as tags de cada registro e apresenta a página.

### Fluxos alternativos

- Projeto inexistente/alheio ou combinação `LEARNING` com status é rejeitada.
- Por padrão, registros arquivados não aparecem.

## UC-14 — Atualizar projeto

| Campo          | Descrição                                                |
| -------------- | -------------------------------------------------------- |
| Ator principal | Usuário autenticado                                      |
| Interesses     | Alterar dados de um projeto preservando campos omitidos. |
| Pré-condições  | Projeto próprio e não arquivado.                         |
| Gatilho        | O usuário informa ao menos um campo editável.            |
| Pós-condições  | Campos informados e data de atualização são modificados. |
| Endpoint       | `PATCH /api/project/:id`                                 |

### Fluxo principal

1. O usuário informa nome, descrição, status e/ou caminho local.
2. O sistema confirma propriedade e possibilidade de edição.
3. O sistema valida e registra somente os campos informados.
4. O sistema apresenta o projeto atualizado.

### Fluxos alternativos

- Corpo sem campo editável é rejeitado.
- `null` remove descrição ou caminho local; ausência preserva o valor.
- Projeto arquivado é somente leitura.

## UC-15 — Arquivar projeto

| Campo          | Descrição                                                         |
| -------------- | ----------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                               |
| Interesses     | Retirar um projeto de uso corrente sem apagar seu histórico.      |
| Pré-condições  | Projeto pertencente ao usuário.                                   |
| Gatilho        | O usuário solicita o arquivamento.                                |
| Pós-condições  | O projeto recebe data de arquivamento e se torna somente leitura. |
| Endpoint       | `PATCH /api/project/:id/archive`                                  |

### Fluxo principal

1. O usuário indica o projeto.
2. O sistema confirma sua propriedade e o arquiva.
3. O sistema apresenta o estado resultante.

### Fluxos alternativos

- Se já estiver arquivado, a operação é idempotente e preserva as datas.

## UC-16 — Restaurar projeto

| Campo          | Descrição                                                          |
| -------------- | ------------------------------------------------------------------ |
| Ator principal | Usuário autenticado                                                |
| Interesses     | Reativar a edição de um projeto arquivado.                         |
| Pré-condições  | Projeto pertencente ao usuário.                                    |
| Gatilho        | O usuário solicita a restauração.                                  |
| Pós-condições  | A data de arquivamento é removida; o status anterior é preservado. |
| Endpoint       | `PATCH /api/project/:id/restore`                                   |

### Fluxo principal

1. O usuário indica o projeto.
2. O sistema confirma sua propriedade e remove o arquivamento.
3. O sistema apresenta o estado resultante.

### Fluxos alternativos

- Se já estiver não arquivado, a operação é idempotente.

## UC-17 — Excluir projeto

| Campo          | Descrição                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                                                     |
| Interesses     | Remover definitivamente um projeto e seus detalhes sem apagar registros técnicos.                       |
| Pré-condições  | Projeto próprio e não arquivado.                                                                        |
| Gatilho        | O usuário solicita a exclusão.                                                                          |
| Pós-condições  | Projeto, tecnologias, comandos e recursos são excluídos; registros relacionados permanecem sem projeto. |
| Endpoint       | `DELETE /api/project/:id`                                                                               |

### Fluxo principal

1. O usuário indica o projeto.
2. O sistema confirma propriedade e possibilidade de modificação.
3. O sistema exclui o projeto e seus detalhes dependentes.
4. O sistema desvincula os registros técnicos relacionados.

### Fluxos alternativos

- Projeto arquivado não pode ser excluído antes de ser restaurado.

## UC-18 — Adicionar tecnologia ao projeto

| Campo          | Descrição                                        |
| -------------- | ------------------------------------------------ |
| Ator principal | Usuário autenticado                              |
| Interesses     | Documentar uma tecnologia e sua versão opcional. |
| Pré-condições  | Projeto próprio e não arquivado.                 |
| Gatilho        | O usuário informa nome e, opcionalmente, versão. |
| Pós-condições  | A tecnologia passa a compor o projeto.           |
| Endpoint       | `POST /api/project/:id/technologies`             |

### Fluxo principal

1. O usuário informa a tecnologia.
2. O sistema confirma que o projeto pode ser modificado.
3. O sistema confirma que o nome ainda não existe no projeto.
4. O sistema registra a tecnologia e apresenta o projeto resultante.

### Fluxos alternativos

- Nome duplicado no projeto ou dados inválidos impedem a inclusão.

## UC-19 — Remover tecnologia do projeto

| Campo          | Descrição                                              |
| -------------- | ------------------------------------------------------ |
| Ator principal | Usuário autenticado                                    |
| Interesses     | Retirar uma tecnologia documentada no projeto.         |
| Pré-condições  | Projeto próprio, não arquivado, contendo a tecnologia. |
| Gatilho        | O usuário seleciona a tecnologia para remoção.         |
| Pós-condições  | A tecnologia é excluída.                               |
| Endpoint       | `DELETE /api/project/:id/technologies/:technologyId`   |

### Fluxo principal

1. O usuário indica projeto e tecnologia.
2. O sistema confirma propriedade, vínculo e possibilidade de edição.
3. O sistema exclui a tecnologia.

### Fluxos alternativos

- Tecnologia de outro projeto é tratada como não encontrada.
- Não existe endpoint para atualizar tecnologia; é necessário remover e criar.

## UC-20 — Adicionar comando ao projeto

| Campo          | Descrição                                                       |
| -------------- | --------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                             |
| Interesses     | Guardar um comando reproduzível com contexto e ordem opcionais. |
| Pré-condições  | Projeto próprio e não arquivado.                                |
| Gatilho        | O usuário informa título e comando.                             |
| Pós-condições  | O comando passa a compor o projeto.                             |
| Endpoint       | `POST /api/project/:id/commands`                                |

### Fluxo principal

1. O usuário informa título, comando, descrição e ordem opcional.
2. O sistema confirma que o projeto pode ser modificado.
3. O sistema valida e registra o comando.
4. O sistema apresenta o comando criado.

### Fluxos alternativos

- Dados inválidos ou projeto arquivado impedem a inclusão.

## UC-21 — Pesquisar comandos do projeto

| Campo          | Descrição                                 |
| -------------- | ----------------------------------------- |
| Ator principal | Usuário autenticado                       |
| Interesses     | Localizar comandos de um projeto próprio. |
| Pré-condições  | Projeto pertencente ao usuário.           |
| Gatilho        | O usuário informa critérios opcionais.    |
| Pós-condições  | Nenhuma alteração de estado.              |
| Endpoint       | `GET /api/project/:projectId/commands`    |

### Fluxo principal

1. O sistema confirma a propriedade do projeto.
2. O sistema filtra por título, comando e/ou descrição, pagina e ordena.
3. O sistema apresenta a página.

### Fluxos alternativos

- Projeto arquivado continua consultável.
- Sem correspondências, a página é vazia.

## UC-22 — Consultar comando do projeto

| Campo          | Descrição                                             |
| -------------- | ----------------------------------------------------- |
| Ator principal | Usuário autenticado                                   |
| Interesses     | Visualizar um comando específico no contexto correto. |
| Pré-condições  | Projeto próprio contendo o comando.                   |
| Gatilho        | O usuário seleciona o comando.                        |
| Pós-condições  | Nenhuma alteração de estado.                          |
| Endpoint       | `GET /api/project/:projectId/commands/:commandId`     |

### Fluxo principal

1. O sistema confirma a propriedade do projeto.
2. O sistema confirma que o comando pertence a esse projeto.
3. O sistema apresenta o comando.

### Fluxos alternativos

- Projeto ou comando fora do escopo é tratado como não encontrado.

## UC-23 — Atualizar comando do projeto

| Campo          | Descrição                                           |
| -------------- | --------------------------------------------------- |
| Ator principal | Usuário autenticado                                 |
| Interesses     | Corrigir ou enriquecer um comando existente.        |
| Pré-condições  | Projeto próprio, não arquivado, contendo o comando. |
| Gatilho        | O usuário informa ao menos um campo editável.       |
| Pós-condições  | Campos informados são atualizados.                  |
| Endpoint       | `PATCH /api/project/:projectId/commands/:commandId` |

### Fluxo principal

1. O sistema confirma o projeto e o vínculo do comando.
2. O sistema valida os campos informados.
3. O sistema atualiza e apresenta o comando.

### Fluxos alternativos

- Corpo vazio é rejeitado.
- `null` remove descrição ou ordem; campos ausentes são preservados.

## UC-24 — Remover comando do projeto

| Campo          | Descrição                                              |
| -------------- | ------------------------------------------------------ |
| Ator principal | Usuário autenticado                                    |
| Interesses     | Excluir um comando que não deve mais compor o projeto. |
| Pré-condições  | Projeto próprio, não arquivado, contendo o comando.    |
| Gatilho        | O usuário solicita a remoção.                          |
| Pós-condições  | O comando é excluído.                                  |
| Endpoint       | `DELETE /api/project/:projectId/commands/:commandId`   |

### Fluxo principal

1. O sistema confirma projeto, propriedade e vínculo do comando.
2. O sistema exclui o comando e confirma sem conteúdo.

### Fluxos alternativos

- Projeto arquivado ou comando fora do projeto impede a remoção.

## UC-25 — Adicionar recurso ao projeto

| Campo          | Descrição                                                      |
| -------------- | -------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                            |
| Interesses     | Guardar um link relevante classificado por tipo.               |
| Pré-condições  | Projeto próprio e não arquivado.                               |
| Gatilho        | O usuário informa rótulo, URL e tipo opcional.                 |
| Pós-condições  | O recurso passa a compor o projeto; tipo omitido vira `OTHER`. |
| Endpoint       | `POST /api/project/:projectId/resources`                       |

### Fluxo principal

1. O usuário informa o recurso.
2. O sistema confirma que o projeto pode ser modificado.
3. O sistema valida a URL e registra o recurso.
4. O sistema apresenta o recurso criado.

### Fluxos alternativos

- URL inválida, URL já usada no mesmo projeto ou projeto arquivado impedem a
  inclusão.

## UC-26 — Pesquisar recursos do projeto

| Campo          | Descrição                                           |
| -------------- | --------------------------------------------------- |
| Ator principal | Usuário autenticado                                 |
| Interesses     | Localizar links documentados em um projeto próprio. |
| Pré-condições  | Projeto pertencente ao usuário.                     |
| Gatilho        | O usuário informa filtros opcionais.                |
| Pós-condições  | Nenhuma alteração de estado.                        |
| Endpoint       | `GET /api/project/:projectId/resources`             |

### Fluxo principal

1. O sistema confirma a propriedade do projeto.
2. O sistema filtra por rótulo, URL e/ou tipo, pagina e ordena.
3. O sistema apresenta a página encontrada.

### Fluxos alternativos

- Projeto arquivado continua consultável.
- Sem correspondências, a página é vazia.

## UC-27 — Consultar recurso do projeto

| Campo          | Descrição                                             |
| -------------- | ----------------------------------------------------- |
| Ator principal | Usuário autenticado                                   |
| Interesses     | Visualizar um recurso específico no contexto correto. |
| Pré-condições  | Projeto próprio contendo o recurso.                   |
| Gatilho        | O usuário seleciona o recurso.                        |
| Pós-condições  | Nenhuma alteração de estado.                          |
| Endpoint       | `GET /api/project/:projectId/resources/:resourceId`   |

### Fluxo principal

1. O sistema confirma a propriedade do projeto.
2. O sistema confirma que o recurso pertence a esse projeto.
3. O sistema apresenta o recurso.

### Fluxos alternativos

- Projeto ou recurso fora do escopo é tratado como não encontrado.

## UC-28 — Atualizar recurso do projeto

| Campo          | Descrição                                             |
| -------------- | ----------------------------------------------------- |
| Ator principal | Usuário autenticado                                   |
| Interesses     | Corrigir rótulo, URL ou tipo de um recurso.           |
| Pré-condições  | Projeto próprio, não arquivado, contendo o recurso.   |
| Gatilho        | O usuário informa ao menos um campo editável.         |
| Pós-condições  | Campos informados são atualizados.                    |
| Endpoint       | `PATCH /api/project/:projectId/resources/:resourceId` |

### Fluxo principal

1. O sistema confirma o projeto e o vínculo do recurso.
2. O sistema valida os campos informados.
3. O sistema atualiza e apresenta o recurso.

### Fluxos alternativos

- Corpo vazio, URL inválida ou projeto arquivado impedem a atualização.
- Os campos desse contrato não aceitam `null` para remoção.

## UC-29 — Remover recurso do projeto

| Campo          | Descrição                                              |
| -------------- | ------------------------------------------------------ |
| Ator principal | Usuário autenticado                                    |
| Interesses     | Excluir um link que não deve mais compor o projeto.    |
| Pré-condições  | Projeto próprio, não arquivado, contendo o recurso.    |
| Gatilho        | O usuário solicita a remoção.                          |
| Pós-condições  | O recurso é excluído.                                  |
| Endpoint       | `DELETE /api/project/:projectId/resources/:resourceId` |

### Fluxo principal

1. O sistema confirma projeto, propriedade e vínculo do recurso.
2. O sistema exclui o recurso e confirma sem conteúdo.

### Fluxos alternativos

- Projeto arquivado ou recurso fora do projeto impede a remoção.
