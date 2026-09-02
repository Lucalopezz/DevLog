# Rastreabilidade entre API e casos de uso

Esta matriz garante que cada operação pública encontrada nos controllers esteja
representada na documentação comportamental.

| Método e rota                                                       | Caso de uso                                                                                       | Protegido |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | :-------: |
| `POST /api/users`                                                   | [UC-01 — Cadastrar usuário](account-and-tags.md#uc-01--cadastrar-usuário)                         |    Não    |
| `POST /api/auth/login`                                              | [UC-02 — Autenticar usuário](account-and-tags.md#uc-02--autenticar-usuário)                       |    Não    |
| `POST /api/auth/logout`                                             | [UC-03 — Encerrar sessão](account-and-tags.md#uc-03--encerrar-sessão)                             |    Não    |
| `GET /api/users/me`                                                 | [UC-04 — Consultar perfil atual](account-and-tags.md#uc-04--consultar-perfil-atual)               |    Sim    |
| `PATCH /api/users/me`                                               | [UC-05 — Atualizar perfil](account-and-tags.md#uc-05--atualizar-perfil)                           |    Sim    |
| `PATCH /api/users/me/password`                                      | [UC-06 — Alterar senha](account-and-tags.md#uc-06--alterar-senha)                                 |    Sim    |
| `POST /api/tag`                                                     | [UC-07 — Criar tag](account-and-tags.md#uc-07--criar-tag)                                         |    Sim    |
| `GET /api/tag`                                                      | [UC-08 — Pesquisar tags](account-and-tags.md#uc-08--pesquisar-tags)                               |    Sim    |
| `DELETE /api/tag/:id`                                               | [UC-09 — Excluir tag](account-and-tags.md#uc-09--excluir-tag)                                     |    Sim    |
| `POST /api/project`                                                 | [UC-10 — Criar projeto](projects.md#uc-10--criar-projeto)                                         |    Sim    |
| `GET /api/project`                                                  | [UC-11 — Pesquisar projetos](projects.md#uc-11--pesquisar-projetos)                               |    Sim    |
| `GET /api/project/:id`                                              | [UC-12 — Consultar projeto](projects.md#uc-12--consultar-projeto)                                 |    Sim    |
| `GET /api/project/:id/technical-entries`                            | [UC-13 — Pesquisar registros de um projeto](projects.md#uc-13--pesquisar-registros-de-um-projeto) |    Sim    |
| `PATCH /api/project/:id`                                            | [UC-14 — Atualizar projeto](projects.md#uc-14--atualizar-projeto)                                 |    Sim    |
| `PATCH /api/project/:id/archive`                                    | [UC-15 — Arquivar projeto](projects.md#uc-15--arquivar-projeto)                                   |    Sim    |
| `PATCH /api/project/:id/restore`                                    | [UC-16 — Restaurar projeto](projects.md#uc-16--restaurar-projeto)                                 |    Sim    |
| `DELETE /api/project/:id`                                           | [UC-17 — Excluir projeto](projects.md#uc-17--excluir-projeto)                                     |    Sim    |
| `POST /api/project/:id/technologies`                                | [UC-18 — Adicionar tecnologia](projects.md#uc-18--adicionar-tecnologia-ao-projeto)                |    Sim    |
| `DELETE /api/project/:id/technologies/:technologyId`                | [UC-19 — Remover tecnologia](projects.md#uc-19--remover-tecnologia-do-projeto)                    |    Sim    |
| `POST /api/project/:id/commands`                                    | [UC-20 — Adicionar comando](projects.md#uc-20--adicionar-comando-ao-projeto)                      |    Sim    |
| `GET /api/project/:projectId/commands`                              | [UC-21 — Pesquisar comandos](projects.md#uc-21--pesquisar-comandos-do-projeto)                    |    Sim    |
| `GET /api/project/:projectId/commands/:commandId`                   | [UC-22 — Consultar comando](projects.md#uc-22--consultar-comando-do-projeto)                      |    Sim    |
| `PATCH /api/project/:projectId/commands/:commandId`                 | [UC-23 — Atualizar comando](projects.md#uc-23--atualizar-comando-do-projeto)                      |    Sim    |
| `DELETE /api/project/:projectId/commands/:commandId`                | [UC-24 — Remover comando](projects.md#uc-24--remover-comando-do-projeto)                          |    Sim    |
| `POST /api/project/:projectId/resources`                            | [UC-25 — Adicionar recurso](projects.md#uc-25--adicionar-recurso-ao-projeto)                      |    Sim    |
| `GET /api/project/:projectId/resources`                             | [UC-26 — Pesquisar recursos](projects.md#uc-26--pesquisar-recursos-do-projeto)                    |    Sim    |
| `GET /api/project/:projectId/resources/:resourceId`                 | [UC-27 — Consultar recurso](projects.md#uc-27--consultar-recurso-do-projeto)                      |    Sim    |
| `PATCH /api/project/:projectId/resources/:resourceId`               | [UC-28 — Atualizar recurso](projects.md#uc-28--atualizar-recurso-do-projeto)                      |    Sim    |
| `DELETE /api/project/:projectId/resources/:resourceId`              | [UC-29 — Remover recurso](projects.md#uc-29--remover-recurso-do-projeto)                          |    Sim    |
| `POST /api/technical-entry`                                         | [UC-30 — Criar registro](technical-entries.md#uc-30--criar-registro-técnico)                      |    Sim    |
| `GET /api/technical-entry`                                          | [UC-31 — Pesquisar registros](technical-entries.md#uc-31--pesquisar-registros-técnicos)           |    Sim    |
| `GET /api/technical-entry/:id`                                      | [UC-32 — Consultar registro](technical-entries.md#uc-32--consultar-registro-técnico)              |    Sim    |
| `PATCH /api/technical-entry/:id`                                    | [UC-33 — Atualizar registro](technical-entries.md#uc-33--atualizar-registro-técnico)              |    Sim    |
| `PATCH /api/technical-entry/:id/resolve`                            | [UC-34 — Resolver problema](technical-entries.md#uc-34--resolver-problema-técnico)                |    Sim    |
| `PATCH /api/technical-entry/:id/reopen`                             | [UC-35 — Reabrir problema](technical-entries.md#uc-35--reabrir-problema-técnico)                  |    Sim    |
| `PATCH /api/technical-entry/:id/archive`                            | [UC-36 — Arquivar registro](technical-entries.md#uc-36--arquivar-registro-técnico)                |    Sim    |
| `DELETE /api/technical-entry/:id`                                   | [UC-37 — Excluir registro](technical-entries.md#uc-37--excluir-registro-técnico)                  |    Sim    |
| `POST /api/technical-entry/:entryId/tags`                           | [UC-38 — Atribuir tag](technical-entries.md#uc-38--atribuir-tag-ao-registro)                      |    Sim    |
| `DELETE /api/technical-entry/:entryId/tags/:tagId`                  | [UC-39 — Remover tag](technical-entries.md#uc-39--remover-tag-do-registro)                        |    Sim    |
| `POST /api/technical-entry/:entryId/solution-attempts`              | [UC-40 — Adicionar tentativa](technical-entries.md#uc-40--adicionar-tentativa-de-solução)         |    Sim    |
| `GET /api/technical-entry/:entryId/solution-attempts`               | [UC-41 — Listar tentativas](technical-entries.md#uc-41--listar-tentativas-de-solução)             |    Sim    |
| `PATCH /api/technical-entry/:entryId/solution-attempts/:attemptId`  | [UC-42 — Atualizar tentativa](technical-entries.md#uc-42--atualizar-tentativa-de-solução)         |    Sim    |
| `DELETE /api/technical-entry/:entryId/solution-attempts/:attemptId` | [UC-43 — Remover tentativa](technical-entries.md#uc-43--remover-tentativa-de-solução)             |    Sim    |

## Elementos internos sem endpoint próprio

`FindUserByEmailUseCase` existe na aplicação, mas não é exposto por controller;
por isso não foi modelado como objetivo independente do ator. Ele é um serviço
interno e não um caso de uso público da API atual.
