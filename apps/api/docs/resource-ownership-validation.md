# Validação de usuário e propriedade dos recursos

## Regra geral

Os recursos da API que pertencem a um usuário (`Project`, `TechnicalEntry` e
`Tag`) devem ser acessíveis somente pelo proprietário autenticado.

O `userId` usado pelos casos de uso vem do `CurrentUser`, preenchido pelo
`AuthGuard` a partir do JWT. Ele não deve ser aceito como uma informação
confiável enviada pelo cliente no corpo da requisição.

## Quando consultar o `UserRepository`

Na criação de um recurso, ainda não existe um recurso que possa ser consultado
para confirmar a propriedade. Por isso, o caso de uso deve verificar se o
usuário existe antes de criar:

```ts
const user = await this.userRepository.findById(userId);

if (user === null) {
  throw new NotFoundException('Usuário não encontrado');
}
```

Essa verificação também evita deixar um erro de chave estrangeira do banco
chegar à aplicação sem uma resposta de negócio apropriada.

Atualmente essa regra é aplicada em:

- `CreateProjectUseCase`;
- `CreateTechnicalEntryUseCase`;
- `CreateTagUseCase`.

## Quando a busca do recurso já é suficiente

Em operações sobre um recurso existente, a busca do próprio recurso pode
validar existência e autorização ao mesmo tempo:

```ts
const project = await this.projectRepository.findById(input.id);

if (project === null || project.userId !== input.userId) {
  throw new NotFoundException('Projeto não encontrado');
}
```

Essa condição significa:

1. se o recurso não existe, a operação falha;
2. se existe, mas pertence a outro usuário, a operação também falha;
3. somente o proprietário continua o fluxo.

Portanto, não é necessário injetar `UserRepository` em todos os casos de uso
de atualização, consulta ou exclusão de projetos e entradas técnicas. Os
casos de uso devem consultar o recurso e conferir seu `userId`.

Essa é a estratégia usada atualmente em:

- `UpdateProjectUseCase`;
- `ArchiveProjectUseCase`;
- `RestoreProjectUseCase`;
- `GetProjectUseCase`;
- `DeleteProjectUseCase`;
- `UpdateTechnicalEntryUseCase`;
- `GetTechnicalEntryUseCase`;
- `DeleteTechnicalEntryUseCase`.

Nas buscas/listagens, a mesma proteção é aplicada diretamente no filtro:

```ts
const filter = { userId: input.userId };
```

Assim, a aplicação não precisa carregar registros de outros usuários para
depois descartá-los.

## Por que o usuário continua válido nesses casos?

No banco, `Project.userId`, `TechnicalEntry.userId` e `Tag.userId` são chaves
estrangeiras obrigatórias para `User`. Além disso, as relações usam
`onDelete: Cascade`. Portanto, um recurso existente não deveria apontar para
um usuário inexistente.

Por isso, ao encontrar um projeto ou uma entrada técnica pertencente ao
usuário autenticado, a existência desse relacionamento já funciona como uma
garantia indireta da existência do usuário.

## Exceção: validar o usuário autenticado no `AuthGuard`

O `AuthGuard` atual verifica a assinatura e a validade do JWT, mas não consulta
o banco para confirmar que o usuário ainda existe. Se o usuário for removido
depois da emissão do token, o token poderá continuar válido até expirar.

Isso não exige adicionar `UserRepository` a todos os casos de uso. Se a regra
do produto passar a exigir revogação imediata, usuários desativados ou
validação da existência em toda requisição, essa responsabilidade deve ser
centralizada no fluxo de autenticação (`AuthGuard` ou uma estratégia de
autenticação).

## Resumo para decisão rápida

| Operação | Validação principal |
| --- | --- |
| Criar projeto, entrada ou tag | Consultar `UserRepository` |
| Criar entrada com projeto | Consultar usuário e validar projeto/proprietário |
| Atualizar, consultar ou excluir | Buscar recurso e conferir `resource.userId` |
| Listar | Filtrar por `userId` |
| Invalidar usuário/token imediatamente | Validar usuário no fluxo de autenticação |
