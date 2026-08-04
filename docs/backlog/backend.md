# Backlog do backend — DevLog

Este documento lista as tarefas necessárias para implementar o backend do DevLog, seguindo os casos de uso e a ordem de implementação descritos em [`docs/usecases/cases.md`](../docs/usecases/cases.md).

Escopo deste arquivo: API NestJS, camada de aplicação, domínio, persistência, autenticação, autorização e testes. O backlog do frontend será criado separadamente.

## Regras transversais

- [ ] Garantir que todo recurso tenha `userId` e pertença ao usuário autenticado.
- [ ] Impedir leitura, alteração ou exclusão lógica de recursos pertencentes a outro usuário.
- [ ] Definir os estados e tipos documentados:
  - [ ] `TechnicalEntry.type`: `ISSUE` ou `LEARNING`.
  - [ ] Status de problema: `OPEN` ou `RESOLVED`.
  - [ ] Status de projeto: `ACTIVE` ou `ARCHIVED`.
  - [ ] Resultado de tentativa: `FAILED`, `PARTIAL` ou `SUCCESSFUL`.
- [ ] Padronizar erros de validação, autenticação, autorização e recurso não encontrado.
- [ ] Definir DTOs, validações de entrada, respostas HTTP e contratos de cada endpoint.
- [ ] Criar testes unitários para regras de domínio e casos de uso.
- [ ] Criar testes end-to-end para os fluxos HTTP principais.

## 1. Fundação compartilhada

- [x] Definir a estrutura dos módulos por feature em `apps/api/src/modules/`. -> shared, user, project, technical-entry, tag, solution-attempt.
- [ ] Definir entidades, identificadores, datas de criação/atualização e estratégia de arquivamento lógico.
- [ ] Configurar o schema do banco e as migrations para usuários, projetos, entradas, tags e seus relacionamentos.
- [ ] Definir as interfaces de repositório usadas pela camada de aplicação.
- [ ] Implementar os adaptadores de persistência para os repositórios.
- [ ] Configurar tratamento global de exceções e validação de DTOs.
- [ ] Configurar a estratégia de autenticação escolhida: JWT ou sessão, sempre com cookie HttpOnly.

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

- [ ] Criar o caso de uso `AuthenticateUser`.
- [ ] Buscar o usuário por email.
- [ ] Comparar a senha informada com o hash armazenado.
- [ ] Retornar erro sem revelar se o email ou a senha está incorreto.
- [ ] Gerar sessão ou JWT após autenticação válida.
- [ ] Enviar o token por cookie HttpOnly com as configurações de segurança adequadas.
- [ ] Criar o endpoint de login.
- [ ] Testar login válido, usuário inexistente, senha incorreta e criação do cookie.

### GetCurrentUser

- [x] Criar o caso de uso `GetCurrentUser`.
- [ ] Criar o guard ou middleware que identifica o usuário autenticado.
- [x] Criar `GET /users/me`.
- [x] Retornar apenas os dados públicos do usuário atual.
- [ ] Testar acesso autenticado e acesso sem autenticação.

### UpdateUser

- [x] Criar o caso de uso `UpdateUser`.
- [x] Permitir a alteração somente do nome do usuário.
- [x] Manter o e-mail imutável após o cadastro.
- [x] Criar `PATCH /users/:id`.
- [ ] Garantir que somente o usuário autenticado possa alterar o próprio perfil.
- [ ] Testar atualização válida, usuário inexistente e tentativa de alteração sem autenticação.

### UpdateUserPassword

- [x] Criar o caso de uso `UpdateUserPassword`.
- [x] Validar a confirmação da nova senha.
- [x] Fazer hash da nova senha antes de persistir.
- [x] Criar `PATCH /users/:id/password`.
- [ ] Exigir autenticação e validar a senha atual obrigatoriamente.
- [ ] Testar atualização válida, senha atual inválida, confirmação divergente e usuário inexistente.

### LogoutUser

- [ ] Criar o caso de uso `LogoutUser`.
- [ ] Invalidar a sessão, quando a estratégia escolhida exigir isso.
- [ ] Remover ou expirar o cookie de autenticação.
- [ ] Criar o endpoint de logout.
- [ ] Testar encerramento da autenticação e comportamento de uma sessão inválida.

## 3. Entradas técnicas — MVP inicial

### CreateTechnicalEntry

- [ ] Criar a entidade de entrada técnica.
- [ ] Criar o caso de uso `CreateTechnicalEntry`.
- [ ] Validar `title`, `type`, `context`, `conclusion?`, `projectId?` e `tags?`.
- [ ] Aceitar somente os tipos `ISSUE` e `LEARNING`.
- [ ] Criar entradas como `OPEN` quando forem do tipo `ISSUE`.
- [ ] Permitir conclusão opcional na criação, conforme o caso de uso.
- [ ] Associar opcionalmente a entrada a um projeto do mesmo usuário.
- [ ] Associar as tags informadas somente se elas pertencerem ao mesmo usuário.
- [ ] Criar o endpoint de criação.
- [ ] Testar criação de `ISSUE`, criação de `LEARNING`, dados inválidos e referências de outro usuário.

### GetTechnicalEntry

- [ ] Criar o caso de uso `GetTechnicalEntry`.
- [ ] Retornar a entrada completa com projeto, tags e, para `ISSUE`, tentativas e status.
- [ ] Garantir que uma entrada de outro usuário não seja encontrada pelo usuário atual.
- [ ] Criar o endpoint de consulta por identificador.
- [ ] Testar retorno completo, entrada inexistente e isolamento entre usuários.

### ListTechnicalEntries

- [ ] Criar o caso de uso `ListTechnicalEntries`.
- [ ] Listar somente entradas do usuário autenticado.
- [ ] Implementar busca textual por `search`.
- [ ] Implementar filtros por `projectId`, `tagId`, `type` e `status`.
- [ ] Definir paginação e ordenação para evitar consultas sem limite.
- [ ] Criar o endpoint de listagem.
- [ ] Testar combinações de filtros e garantir que resultados de outros usuários nunca sejam retornados.

### UpdateTechnicalEntry

- [ ] Criar o caso de uso `UpdateTechnicalEntry`.
- [ ] Permitir alterar `title`, `context`, `conclusion`, `project` e `tags`.
- [ ] Impedir alteração livre de `type` depois da criação.
- [ ] Validar que o novo projeto e as novas tags pertençam ao usuário.
- [ ] Criar o endpoint de atualização.
- [ ] Testar atualização válida, entrada inexistente, recurso de outro usuário e tentativa de troca de tipo.

## 4. Tags

### CreateTag e ListTags

- [ ] Criar a entidade e o repositório de tags.
- [ ] Criar o caso de uso `CreateTag`.
- [ ] Validar `name`.
- [ ] Impedir duas tags com o mesmo nome para o mesmo usuário.
- [ ] Criar o caso de uso `ListTags`.
- [ ] Listar somente tags do usuário autenticado.
- [ ] Criar os endpoints de criação e listagem.
- [ ] Testar duplicidade, isolamento por usuário e listagem.

### Relacionar tags e entradas

- [ ] Criar a relação entre tags e entradas técnicas.
- [ ] Criar o caso de uso `AddTagToTechnicalEntry`.
- [ ] Validar que a tag e a entrada pertençam ao usuário autenticado.
- [ ] Impedir relação duplicada entre a mesma tag e a mesma entrada.
- [ ] Criar o caso de uso `RemoveTagFromTechnicalEntry`.
- [ ] Remover somente a relação, sem excluir a tag.
- [ ] Criar os endpoints de adicionar e remover relação.
- [ ] Testar relação válida, referências de outro usuário e remoção sem apagar a tag.

## 5. Projetos — MVP inicial

### CreateProject

- [ ] Criar a entidade de projeto.
- [ ] Criar o caso de uso `CreateProject`.
- [ ] Validar `name`, `description?`, `repositoryUrl?`, `localPath?` e `status?`.
- [ ] Tornar o nome obrigatório.
- [ ] Validar `repositoryUrl` quando informado.
- [ ] Associar o projeto ao usuário autenticado.
- [ ] Definir o status inicial do projeto como `ACTIVE` quando não informado.
- [ ] Criar o endpoint de criação.
- [ ] Testar criação válida, nome ausente, URL inválida e associação ao usuário correto.

### GetProject e ListProjects

- [ ] Criar o caso de uso `GetProject`.
- [ ] Retornar o projeto do usuário com tecnologias, comandos, recursos e entradas relacionadas.
- [ ] Criar o caso de uso `ListProjects`.
- [ ] Listar somente projetos do usuário autenticado.
- [ ] Implementar inicialmente filtros por `name` e `status`.
- [ ] Manter filtros futuros (`archived` e `technology`) como extensão planejada.
- [ ] Criar os endpoints de consulta individual e listagem.
- [ ] Testar agregação do projeto, filtros e isolamento entre usuários.

### UpdateProject

- [ ] Criar o caso de uso `UpdateProject`.
- [ ] Permitir atualizar nome, descrição, repositório, caminho local e status.
- [ ] Garantir que somente o proprietário possa alterar o projeto.
- [ ] Criar o endpoint de atualização.
- [ ] Testar atualização válida, URL inválida e tentativa de alteração por outro usuário.

## 6. Relação projeto × entrada técnica

- [ ] Permitir criar entrada sem projeto.
- [ ] Permitir vincular uma entrada a um projeto do mesmo usuário.
- [ ] Permitir alterar ou remover o projeto relacionado durante `UpdateTechnicalEntry`.
- [ ] Incluir entradas relacionadas na consulta de um projeto.
- [ ] Garantir que arquivar um projeto não remova nem desvincule suas entradas.
- [ ] Testar o fluxo: criar projeto → criar entrada → relacionar entrada → consultar projeto.

## 7. Problemas e tentativas de solução

### AddSolutionAttempt

- [ ] Criar a entidade de tentativa de solução.
- [ ] Criar o caso de uso `AddSolutionAttempt`.
- [ ] Validar `entryId`, `description` e `result`.
- [ ] Permitir tentativas somente para entradas do tipo `ISSUE`.
- [ ] Aceitar somente `FAILED`, `PARTIAL` ou `SUCCESSFUL`.
- [ ] Impedir novas tentativas em entradas arquivadas.
- [ ] Garantir que a entrada pertença ao usuário autenticado.
- [ ] Criar o endpoint de inclusão de tentativa.
- [ ] Testar tentativa em `ISSUE`, rejeição em `LEARNING`, resultado inválido e entrada arquivada.

### ResolveTechnicalIssue

- [ ] Criar o caso de uso `ResolveTechnicalIssue`.
- [ ] Permitir resolução somente para entradas do tipo `ISSUE`.
- [ ] Exigir `conclusion`.
- [ ] Alterar o status de `OPEN` para `RESOLVED`.
- [ ] Registrar `resolvedAt`.
- [ ] Permitir resolução mesmo sem uma tentativa `SUCCESSFUL`, conforme o caso de uso.
- [ ] Criar o endpoint de resolução.
- [ ] Testar conclusão obrigatória, tipo inválido, transição de status e isolamento por usuário.

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

### ArchiveProject

- [ ] Criar o caso de uso `ArchiveProject`.
- [ ] Alterar o projeto de `ACTIVE` para `ARCHIVED` sem exclusão física.
- [ ] Impedir operações incompatíveis com projeto arquivado conforme as regras do domínio.
- [ ] Preservar tecnologias, comandos, recursos e entradas relacionadas.
- [ ] Criar o endpoint de arquivamento.
- [ ] Testar transição de status, persistência dos relacionamentos e autorização.

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
