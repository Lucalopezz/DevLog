# Backlog do backend — DevLog

Este documento lista as tarefas necessárias para implementar o backend do DevLog, seguindo os casos de uso e a ordem de implementação descritos em [`docs/usecases/cases.md`](../usecases/cases.md).

Escopo deste arquivo: API NestJS, camada de aplicação, domínio, persistência, autenticação, autorização e testes. O backlog do frontend será criado separadamente.

O passo a passo da autenticação está em [`docs/guides/authentication_workflow.md`](../guides/authentication_workflow.md).

> [!NOTE]
> Uma tarefa só deve ser marcada como concluída quando existir implementação verificável no backend. A presença de uma tabela no Prisma, por exemplo, não significa que o caso de uso e os endpoints correspondentes já estejam prontos.

## Regras transversais

- [ ] Garantir que todo recurso tenha `userId` e pertença ao usuário autenticado.
- [ ] Impedir leitura, alteração ou exclusão lógica de recursos pertencentes a outro usuário.
- [ ] Definir os estados e tipos documentados:
  - [x] `TechnicalEntry.type`: `ISSUE` ou `LEARNING`.
  - [x] Status de problema: a entidade retorna `OPEN` quando `resolvedAt` está vazio e `RESOLVED` quando está preenchido; no MVP, o status não possui coluna própria.
  - [x] Status de projeto: `ACTIVE`, `INACTIVE` ou `FINISHED`; o enum, a validação e a atualização já existem. Ainda falta definir como esses estados se relacionam ao arquivamento lógico por `archivedAt`.
  - [x] Resultado de tentativa: `FAILED`, `PARTIAL` ou `SUCCESSFUL` no schema Prisma.
- [ ] Padronizar erros de validação, autenticação, autorização e recurso não encontrado.
- [ ] Definir DTOs, validações de entrada, respostas HTTP e contratos de cada endpoint.
- [ ] Criar testes unitários para regras de domínio e casos de uso.
- [ ] Criar testes end-to-end para os fluxos HTTP principais.

## 1. Fundação compartilhada

- [x] Definir a estrutura dos módulos por feature em `apps/api/src/`. -> shared, user, auth e technicalEntry.
- [ ] Definir entidades, identificadores, datas de criação/atualização e estratégia de arquivamento lógico.
- [x] Configurar o schema do banco e a migration inicial para usuários, projetos, entradas, tags e seus relacionamentos.
- [x] Definir as interfaces de repositório compartilhadas e as de usuário, projeto, entrada técnica e tag.
- [x] Implementar os adaptadores Prisma para usuário, projeto, entrada técnica, relação entrada × tag e tag.
- [ ] Implementar tratamento global de exceções.
- [x] Centralizar as configurações globais da API em `applyGlobalConfig`, incluindo prefixo `/api`, cookie parser, CORS, serialização e validação.
- [x] Configurar `ValidationPipe` global com status `422`, `whitelist`, `forbidNonWhitelisted` e `transform`.
- [x] Habilitar `credentials: true` no CORS para permitir o envio do cookie de autenticação nas requisições do frontend em outra origem.
- [x] Configurar JWT em cookie HttpOnly; o logout atual remove o cookie porque a estratégia é stateless.

## 2. Usuários e autenticação

### RegisterUser

- [x] Criar o caso de uso `CreateUserUseCase`.
- [x] Validar `name`, `email` e `password`.
- [x] Rejeitar email já cadastrado. -> findUserByEmail
- [x] Fazer hash da senha antes de persistir o usuário.
- [x] Nunca retornar ou armazenar a senha em texto puro.
- [x] Criar o endpoint de cadastro.
- [ ] Testar cadastro válido, email inválido, email duplicado e senha fora dos critérios mínimos.

### AuthenticateUser

- [x] Criar o caso de uso `AuthenticateUser`.
- [x] Buscar o usuário por email.
- [x] Comparar a senha informada com o hash armazenado.
- [x] Retornar erro sem revelar se o email ou a senha está incorreto.
- [x] Gerar JWT após autenticação válida.
- [x] Enviar o token por cookie HttpOnly com `secure`, `sameSite`, `maxAge` e `path` configurados.
- [x] Criar o endpoint `POST /api/auth/login`.
- [ ] Testar login válido, usuário inexistente, senha incorreta e criação do cookie.

### GetCurrentUser

- [x] Criar o caso de uso `GetCurrentUser`.
- [x] Criar o guard que identifica o usuário autenticado pelo cookie JWT.
- [x] Criar `GET /api/users/me`.
- [x] Retornar apenas os dados públicos do usuário atual.
- [ ] Testar acesso autenticado e acesso sem autenticação.

### UpdateUser

- [x] Criar o caso de uso `UpdateUser`.
- [x] Permitir a alteração somente do nome do usuário.
- [x] Manter o e-mail imutável após o cadastro.
- [x] Criar `PATCH /api/users/me`, usando o usuário identificado pelo guard.
- [ ] Testar atualização válida, usuário inexistente e tentativa de alteração sem autenticação.

### UpdateUserPassword

- [x] Criar o caso de uso `UpdateUserPassword`.
- [x] Validar a confirmação da nova senha.
- [x] Fazer hash da nova senha antes de persistir.
- [x] Criar `PATCH /api/users/me/password`, usando o usuário identificado pelo guard.
- [x] Exigir autenticação e tornar `currentPassword` obrigatório para validar a senha atual; esse valor deve ser usado somente na validação e nunca persistido no banco.
- [ ] Testar atualização válida, senha atual inválida, confirmação divergente e usuário inexistente.

### LogoutUser

- [x] Criar o fluxo de logout stateless; não há sessão persistida para invalidar.
- [x] Remover o cookie de autenticação.
- [x] Criar o endpoint `POST /api/auth/logout`.
- [ ] Testar encerramento da autenticação e comportamento de uma sessão inválida.

## 3. Entradas técnicas — MVP inicial

> A camada de domínio possui entidade, enum, validação, contrato de repositório, mapper e repositório Prisma. Criação, listagem paginada, consulta individual, atualização, exclusão física, tentativas de solução e resolução já possuem casos de uso, presenters e endpoints protegidos pelo `AuthGuard`. A relação com projetos e tags já possui validações e agregação de tags nas respostas. A etapa ainda não está concluída: faltam tags na criação/alteração, arquivamento e testes HTTP completos.

### CreateTechnicalEntry

- [x] Criar a entidade de entrada técnica.
- [x] Criar o caso de uso `CreateTechnicalEntry`.
- [x] Validar `title`, `type`, `context` e `conclusion?` no DTO e no domínio.
- [x] Adicionar `projectId?` ao fluxo de criação e validar sua referência.
- [ ] Adicionar `tags?` ao fluxo de criação e validar suas referências.
- [x] Aceitar somente os tipos `ISSUE` e `LEARNING` na entidade e no schema Prisma.
- [x] Criar entradas do tipo `ISSUE` sem `resolvedAt`; a entidade considera a entrada `OPEN` enquanto essa data não estiver preenchida.
- [x] Definir `TechnicalEntryStatus` no domínio e calcular o status na entidade, deixando o mapper responsável apenas por expor o valor na saída.
- [x] Permitir conclusão opcional na criação, conforme o caso de uso.
- [x] Associar opcionalmente a entrada a um projeto do mesmo usuário, rejeitando projeto inexistente, de outro usuário ou arquivado.
- [ ] Associar as tags informadas somente se elas pertencerem ao mesmo usuário.
- [x] Criar o endpoint autenticado `POST /api/technical-entry`.
- [x] Testar criação de `ISSUE`, entrada sem projeto, projeto de outro usuário e projeto arquivado.
- [ ] Completar testes de criação de `LEARNING`, dados inválidos, projeto inexistente e tags.

### GetTechnicalEntry

- [x] Criar o caso de uso `GetTechnicalEntry`.
- [x] Disponibilizar busca por identificador no contrato e no repositório Prisma.
- [x] Retornar a entrada com `projectId`, tags associadas e status derivado para `ISSUE`.
- [ ] Retornar detalhes do projeto e, para `ISSUE`, tentativas e histórico de resolução.
- [x] Garantir que uma entrada de outro usuário não seja encontrada pelo usuário atual.
- [x] Criar o endpoint autenticado `GET /api/technical-entry/:id`.
- [x] Testar a consulta básica e o isolamento entre usuários em teste unitário.
- [ ] Testar entrada inexistente e o retorno completo com suas relações.

### ListTechnicalEntries

- [x] Criar o caso de uso de listagem, implementado como `SearchTechnicalEntryUseCase`.
- [x] Disponibilizar paginação e ordenação no repositório Prisma.
- [x] Disponibilizar no repositório filtros por `userId`, `projectId`, título, tipo e arquivamento.
- [x] Listar somente entradas do usuário autenticado, sobrescrevendo qualquer dado externo com o `userId` obtido pelo guard.
- [x] Definir `title` como o parâmetro oficial de busca textual e aplicar correspondência parcial case-insensitive no repositório.
- [x] Implementar filtros por `projectId` e `type` no caso de uso/API.
- [x] Validar, quando `projectId` é informado, que o projeto existe e pertence ao usuário autenticado.
- [ ] Implementar o filtro por `tagId`; a relação com tags já existe, mas o filtro ainda não foi implementado.
- [x] Implementar o filtro por `status`, validando o enum e traduzindo `OPEN`/`RESOLVED` para condições sobre `resolvedAt` restritas a `ISSUE`.
- [x] Expor paginação e ordenação através de DTO, caso de uso e presenter de coleção.
- [x] Manter `perPage` sem limite máximo por decisão de produto, preservando a liberdade do usuário sobre o tamanho da página.
- [x] Criar o endpoint autenticado `GET /api/technical-entry`.
- [x] Criar o endpoint autenticado `GET /api/project/:id/technical-entries`, reutilizando o caso de uso paginado de entradas.
- [x] Testar conversão/validação do DTO, mapeamento do caso de uso e formato `data`/`meta` do presenter.
- [x] Testar projeto inexistente ou pertencente a outro usuário no filtro de busca.
- [ ] Testar o repositório Prisma, combinações de filtros e garantir via HTTP que resultados de outros usuários nunca sejam retornados.

### UpdateTechnicalEntry

- [x] Criar o caso de uso `UpdateTechnicalEntry`.
- [x] Permitir alterar `title`, `context` e `conclusion`, inclusive remover a conclusão.
- [x] Impedir alteração de `type` pela API depois da criação, omitindo o campo do DTO e do input do caso de uso.
- [x] Permitir alterar ou remover o projeto somente depois de validar sua propriedade e seu estado não arquivado.
- [ ] Permitir substituir ou remover tags pelo próprio `UpdateTechnicalEntry`; atualmente essa responsabilidade pertence aos casos de uso específicos de associação e remoção.
- [x] Validar que o novo projeto pertença ao usuário e não esteja arquivado.
- [x] Validar a propriedade das tags nos casos de uso de associação e remoção; `UpdateTechnicalEntry` não recebe tags diretamente.
- [x] Criar o endpoint autenticado `PATCH /api/technical-entry/:id`.
- [x] Testar atualização de conteúdo, remoção de conclusão/projeto e isolamento entre usuários em teste unitário.
- [ ] Testar entrada inexistente, projeto/tags de outro usuário, validação do DTO e tentativa de troca de tipo pela API.

### DeleteTechnicalEntry — implementação atual a revisar

- [x] Criar o caso de uso `DeleteTechnicalEntry` com verificação do proprietário.
- [x] Criar o endpoint autenticado `DELETE /api/technical-entry/:id` com resposta `204 No Content`.
- [x] Testar exclusão e isolamento entre usuários em teste unitário.
- [ ] Decidir se a exclusão física faz parte do produto ou se deve ser substituída por `ArchiveTechnicalEntry`, como definido nos casos de uso e na seção de arquivamento deste backlog.
- [ ] Se a exclusão física for mantida, documentar explicitamente que ela também remove tentativas e relações com tags por `ON DELETE CASCADE`.

### Pendências encontradas na revisão da etapa

> As pendências de testes e2e abaixo foram adiadas até a etapa dedicada a testes HTTP; os fluxos unitários e de integração das tags já estão implementados.

- [x] Criar testes unitários para `CreateTechnicalEntryUseCase`.
- [x] Criar testes da entidade técnica.
- [ ] Ampliar os testes do repositório Prisma; a tradução do filtro de status e alguns fluxos de persistência estão cobertos, mas as demais combinações de filtros ainda não são exercitadas diretamente.
- [ ] Corrigir a configuração do Jest e2e para resolver os imports relativos `.js` do cliente Prisma gerado; atualmente a suíte falha antes de executar qualquer teste.
- [ ] Aplicar `applyGlobalConfig` também no bootstrap dos testes e2e, garantindo que eles exercitem o prefixo `/api`, validação, cookies e serialização usados em produção.
- [ ] Substituir o teste e2e legado de `GET /` pelos fluxos de criação, listagem, consulta, atualização e exclusão de entradas técnicas.
- [x] Validar UUIDs recebidos em `projectId` na criação/atualização e nos parâmetros `:id`; somente o `projectId` da busca já utiliza `@IsUUID`.
- [x] Validar os limites persistidos pelo banco, especialmente `title` com no máximo 200 caracteres, para retornar erro de entrada em vez de erro de persistência.
- [x] Corrigir o teste de saída paginada de `SearchTechnicalEntryUseCase` para sempre informar o `userId` obrigatório.
- [x] Encapsular as transições de domínio: `conclude()` deve aceitar somente `ISSUE` e exigir conclusão, enquanto alteração de tipo, resolução e arquivamento não devem ficar disponíveis como atualizações genéricas.
- [x] Padronizar os nomes de arquivos e símbolos que ainda usam `technicalEntry`/`techinicalEntry` para kebab-case e corrigir o typo, sem misturar essa refatoração com uma feature nova.

## 4. Tags

### CreateTag e ListTags

- [x] Criar a entidade e o repositório de tags.
- [x] Criar o caso de uso `CreateTag`.
- [x] Validar `name`.
- [x] Impedir duas tags com o mesmo nome para o mesmo usuário.
- [x] Criar o caso de uso `ListTags`.
- [x] Listar somente tags do usuário autenticado.
- [x] Criar os endpoints de criação e listagem.
- [x] Testar duplicidade, isolamento por usuário e listagem em testes unitários e de integração.

### Relacionar tags e entradas

- [x] Criar a relação entre tags e entradas técnicas.
- [x] Criar o caso de uso `AddTagToTechnicalEntry`.
- [x] Validar que a tag e a entrada pertençam ao usuário autenticado.
- [x] Impedir relação duplicada entre a mesma tag e a mesma entrada.
- [x] Criar o caso de uso `RemoveTagFromTechnicalEntry`.
- [x] Remover somente a relação, sem excluir a tag.
- [x] Criar os endpoints de adicionar e remover relação.
- [x] Testar relação válida, referências de outro usuário, idempotência e remoção sem apagar a tag.

## 5. Projetos — MVP inicial

### CreateProject

- [x] Criar a entidade de projeto.
- [x] Criar o caso de uso `CreateProject`.
- [x] Validar `name` e `description?`; na criação o status é definido como `ACTIVE` e `localPath` ainda não faz parte do fluxo.
- [x] Tornar o nome obrigatório.
- [x] Associar o projeto ao usuário autenticado.
- [x] Definir o status inicial do projeto como `ACTIVE` quando não informado.
- [x] Criar o endpoint de criação.
- [x] Testar criação válida, ausência de descrição e associação ao usuário correto.
- [ ] Testar validações de entrada do DTO, incluindo nome ausente.

### GetProject e ListProjects

- [x] Criar o caso de uso `GetProject`.
- [ ] Retornar o projeto do usuário com tecnologias, comandos e recursos relacionados.
- [x] Disponibilizar as entradas técnicas relacionadas por endpoint separado e paginado: `GET /api/project/:id/technical-entries`.
- [x] Criar o caso de uso `ListProjects`.
- [x] Listar somente projetos do usuário autenticado.
- [x] Implementar inicialmente filtros por `name` e `status`.
- [x] Implementar o filtro `archivedAt`.
- [ ] Implementar o filtro por tecnologia como extensão planejada.
- [x] Criar os endpoints de consulta individual e listagem.
- [x] Testar regras dos casos de uso, filtros e isolamento entre usuários.
- [ ] Testar os endpoints HTTP e a agregação das relações ainda não implementadas.

### UpdateProject

- [x] Criar o caso de uso `UpdateProject`.
- [x] Permitir atualizar nome e status pelo caso de uso principal.
- [x] Permitir atualizar ou remover descrição e caminho local pelos casos de uso específicos.
- [x] Garantir que somente o proprietário possa alterar o projeto.
- [x] Criar o endpoint de atualização.
- [x] Testar atualização válida, descrição/caminho e tentativa de alteração por outro usuário.
- [ ] Testar validações de entrada do DTO.

## 6. Relação projeto × entrada técnica

- [x] Permitir criar entrada sem projeto.
- [x] Permitir vincular uma entrada a um projeto do mesmo usuário.
- [x] Permitir alterar ou remover o projeto relacionado durante `UpdateTechnicalEntry`.
- [x] Disponibilizar entradas relacionadas na rota paginada `GET /api/project/:id/technical-entries`.
- [x] Arquivar um projeto altera somente o projeto e não remove nem desvincula suas entradas.
- [ ] Testar o fluxo HTTP completo: criar projeto → criar entrada → relacionar entrada → consultar entradas do projeto.

## 7. Problemas e tentativas de solução

### AddSolutionAttempt

- [x] Criar a entidade de tentativa de solução.
- [x] Criar o caso de uso `AddSolutionAttempt`.
- [x] Validar `entryId`, `description` e `result`.
- [x] Permitir tentativas somente para entradas do tipo `ISSUE`.
- [x] Aceitar somente `FAILED`, `PARTIAL` ou `SUCCESSFUL`.
- [x] Impedir novas tentativas em entradas arquivadas.
- [x] Garantir que a entrada pertença ao usuário autenticado.
- [x] Criar o endpoint de inclusão de tentativa.
- [ ] Testar tentativa em `ISSUE`, rejeição em `LEARNING`, resultado inválido e entrada arquivada.

### ListSolutionAttempts

- [x] Criar o caso de uso de listagem paginada de tentativas.
- [x] Permitir filtrar tentativas por resultado.
- [x] Garantir que a entrada pertença ao usuário autenticado antes da consulta.
- [x] Criar o endpoint `GET /api/technical-entry/:entryId/solution-attempts`.
- [x] Testar listagem, filtro por resultado e isolamento por usuário.

### ResolveTechnicalIssue

- [x] Criar o caso de uso `ResolveTechnicalIssue`.
- [x] Permitir resolução somente para entradas do tipo `ISSUE`.
- [x] Exigir `conclusion`.
- [x] Alterar o status de `OPEN` para `RESOLVED`.
- [x] Registrar `resolvedAt`.
- [x] Permitir resolução mesmo sem uma tentativa `SUCCESSFUL`, conforme o caso de uso.
- [x] Criar o endpoint `PATCH /api/technical-entry/:id/resolve`.
- [x] Testar conclusão obrigatória, tipo inválido, transição de status e isolamento por usuário.

### ReopenTechnicalIssue

- [ ] Criar o caso de uso `ReopenTechnicalIssue`.
- [ ] Alterar o status de `RESOLVED` para `OPEN`.
- [ ] Preservar tentativas, conclusão anterior e histórico necessário.
- [ ] Criar o endpoint de reabertura.
- [ ] Testar reabertura e preservação dos dados anteriores.

## 8. Detalhes de projetos

### Project Technologies

- [ ] Criar a entidade ou relação de tecnologia do projeto.
- [ ] Criar o caso de uso `AddProjectTechnology`.
- [ ] Validar `projectId`, `name` e `version?`.
- [ ] Garantir que o projeto pertença ao usuário.
- [ ] Impedir a mesma tecnologia duas vezes no mesmo projeto.
- [ ] Criar o caso de uso `RemoveProjectTechnology`.
- [ ] Remover a tecnologia sem remover tags ou entradas técnicas com o mesmo nome.
- [ ] Criar os endpoints de adicionar e remover tecnologia.
- [ ] Testar duplicidade, autorização e independência entre tecnologia e tag.

### Project Commands

- [ ] Criar a entidade de comando do projeto.
- [ ] Criar o caso de uso `AddProjectCommand`.
- [ ] Validar `projectId`, `title`, `command` e `description?`.
- [ ] Criar o caso de uso `UpdateProjectCommand`.
- [ ] Criar o caso de uso `RemoveProjectCommand`.
- [ ] Garantir propriedade do projeto em todas as operações.
- [ ] Criar os endpoints de adicionar, atualizar e remover comando.
- [ ] Testar ciclo completo e tentativa de acesso por outro usuário.

### Project Resources

- [ ] Criar a entidade de recurso do projeto.
- [ ] Criar o caso de uso `AddProjectResource`.
- [ ] Validar `projectId`, `label`, `url` e `type?`.
- [ ] Validar a URL do recurso.
- [ ] Criar o caso de uso `UpdateProjectResource`.
- [ ] Criar o caso de uso `RemoveProjectResource`.
- [ ] Garantir propriedade do projeto em todas as operações.
- [ ] Criar os endpoints de adicionar, atualizar e remover recurso.
- [ ] Testar ciclo completo, URL inválida e autorização.

## 9. Arquivamento

### ArchiveProject — implementação atual: `ToggleProjectArchive`

- [x] Criar o caso de uso de arquivamento/restauração, implementado como `ToggleProjectArchive`.
- [x] Alterar o projeto para arquivado sem exclusão física, preenchendo `archivedAt`.
- [ ] Definir a relação entre `archivedAt` e `ProjectStatus` (`ACTIVE`, `INACTIVE` ou `FINISHED`).
- [ ] Impedir operações incompatíveis com projeto arquivado conforme as regras do domínio.
- [ ] Preservar tecnologias, comandos e recursos relacionados; a preservação das entradas técnicas já está coberta na relação projeto × entrada.
- [x] Criar o endpoint autenticado `PATCH /api/project/:id/archive`.
- [x] Testar arquivamento, restauração e autorização no caso de uso.
- [ ] Testar a preservação dos relacionamentos por HTTP.

### ArchiveTechnicalEntry

- [ ] Criar o caso de uso `ArchiveTechnicalEntry`.
- [ ] Implementar arquivamento lógico da entrada sem exclusão física.
- [ ] Definir o comportamento de entradas arquivadas na listagem e na consulta detalhada.
- [ ] Impedir novas tentativas de solução em entrada arquivada.
- [ ] Criar o endpoint de arquivamento.
- [ ] Testar arquivamento, preservação do histórico e isolamento por usuário.

## 10. Entrega incremental sugerida

- [ ] Entregar a fundação compartilhada.
- [ ] Entregar cadastro, login, usuário atual e logout.
- [ ] Entregar criação, consulta, listagem e atualização de entradas técnicas.
- [ ] Entregar criação, listagem e relacionamento de tags.
- [ ] Entregar criação, consulta, listagem e atualização de projetos.
- [ ] Entregar relacionamento entre projetos e entradas.
- [ ] Entregar tentativas, resolução e reabertura de problemas.
- [ ] Entregar tecnologias, comandos e recursos de projetos.
- [ ] Entregar arquivamento de projetos e entradas.
- [ ] Revisar documentação da API e atualizar os testes de regressão a cada etapa.

## Critério de conclusão do backend do MVP

- [ ] Um usuário consegue se cadastrar, autenticar, consultar a própria conta e sair.
- [ ] Um usuário autenticado consegue criar e consultar projetos.
- [ ] Um usuário autenticado consegue criar, atualizar, listar e consultar entradas técnicas.
- [ ] Entradas podem ser relacionadas a projetos e tags do mesmo usuário.
- [ ] A listagem de entradas suporta busca e filtros documentados.
- [ ] Problemas podem registrar tentativas, ser resolvidos e reabertos.
- [ ] Nenhum usuário consegue acessar dados de outro usuário.
- [ ] Os principais fluxos possuem testes unitários e end-to-end.
