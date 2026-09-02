# Casos de uso — registros técnicos

Todos os casos deste arquivo usam o ator **Usuário autenticado**. Um registro,
tag, projeto ou tentativa fora do escopo do usuário é tratado como não
encontrado, evitando revelar dados de outra conta.

## UC-30 — Criar registro técnico

| Campo          | Descrição                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------ |
| Ator principal | Usuário autenticado                                                                        |
| Interesses     | Documentar um problema ou aprendizado e, opcionalmente, relacioná-lo a um projeto próprio. |
| Pré-condições  | Conta existente; projeto informado deve ser próprio e não arquivado.                       |
| Gatilho        | O usuário informa título, contexto, tipo e dados opcionais.                                |
| Pós-condições  | Um registro não arquivado pertencente ao usuário é criado.                                 |
| Endpoint       | `POST /api/technical-entry`                                                                |

### Fluxo principal

1. O usuário informa título, contexto, tipo (`ISSUE` ou `LEARNING`), projeto e
   conclusão opcionais.
2. Se houver projeto, o sistema confirma propriedade e disponibilidade.
3. O sistema valida e registra a entrada.
4. O sistema apresenta o registro criado.

### Fluxos alternativos

- Projeto inexistente, alheio ou arquivado é tratado como não encontrado.
- Dados inválidos impedem a criação.
- Informar conclusão não marca automaticamente um `ISSUE` como resolvido.

## UC-31 — Pesquisar registros técnicos

| Campo          | Descrição                                                                  |
| -------------- | -------------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                        |
| Interesses     | Recuperar seu histórico por projeto, título, tipo, status ou arquivamento. |
| Pré-condições  | Requisição autenticada.                                                    |
| Gatilho        | O usuário solicita uma página com critérios opcionais.                     |
| Pós-condições  | Nenhuma alteração de estado.                                               |
| Endpoint       | `GET /api/technical-entry`                                                 |

### Fluxo principal

1. O usuário informa filtros, paginação e ordenação opcionais.
2. Se houver projeto, o sistema confirma sua propriedade.
3. O sistema busca somente registros do usuário.
4. O sistema reúne as tags de cada registro.
5. O sistema apresenta os itens e metadados da página.

### Fluxos alternativos

- Por padrão, somente registros não arquivados são buscados.
- Status com tipo `LEARNING` é rejeitado, pois aprendizado não possui status.
- Projeto alheio/inexistente ou critérios inválidos interrompem a pesquisa.

## UC-32 — Consultar registro técnico

| Campo          | Descrição                                     |
| -------------- | --------------------------------------------- |
| Ator principal | Usuário autenticado                           |
| Interesses     | Visualizar um registro próprio com suas tags. |
| Pré-condições  | Registro pertencente ao usuário.              |
| Gatilho        | O usuário seleciona o registro.               |
| Pós-condições  | Nenhuma alteração de estado.                  |
| Endpoint       | `GET /api/technical-entry/:id`                |

### Fluxo principal

1. O usuário indica o registro.
2. O sistema confirma sua propriedade.
3. O sistema reúne as tags atribuídas.
4. O sistema apresenta registro e tags.

### Fluxos alternativos

- Registro inexistente ou alheio é tratado como não encontrado.
- Tentativas possuem uma consulta própria e não são agregadas nesta resposta.

## UC-33 — Atualizar registro técnico

| Campo          | Descrição                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Ator principal | Usuário autenticado                                                      |
| Interesses     | Corrigir conteúdo ou associação do registro preservando campos omitidos. |
| Pré-condições  | Registro pertencente ao usuário.                                         |
| Gatilho        | O usuário informa ao menos um campo editável.                            |
| Pós-condições  | Título, contexto, conclusão e/ou projeto são atualizados.                |
| Endpoint       | `PATCH /api/technical-entry/:id`                                         |

### Fluxo principal

1. O sistema localiza o registro do usuário.
2. Se um novo projeto for informado, confirma que é próprio e não arquivado.
3. O sistema valida e aplica apenas os campos enviados.
4. O sistema apresenta o registro atualizado.

### Fluxos alternativos

- Corpo sem campo editável é rejeitado.
- `projectId: null` desvincula o projeto e `conclusion: null` remove a conclusão.
- Registro arquivado ainda pode ser atualizado na implementação atual.
- Alterar a conclusão por este endpoint não altera `resolvedAt`.

## UC-34 — Resolver problema técnico

| Campo          | Descrição                                                                              |
| -------------- | -------------------------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                                    |
| Interesses     | Registrar a conclusão de um problema aberto.                                           |
| Pré-condições  | Registro próprio, do tipo `ISSUE`, com status `OPEN`.                                  |
| Gatilho        | O usuário informa a conclusão.                                                         |
| Pós-condições  | Conclusão e data de resolução são registradas atomicamente; status passa a `RESOLVED`. |
| Endpoint       | `PATCH /api/technical-entry/:id/resolve`                                               |

### Fluxo principal

1. O usuário indica o problema e sua conclusão.
2. O sistema confirma tipo e estado aberto.
3. O sistema registra conclusão e instante de resolução.
4. O sistema apresenta o problema resolvido.

### Fluxos alternativos

- `LEARNING`, problema já resolvido ou conclusão inválida impedem a transição.
- Registro arquivado ainda pode ser resolvido na implementação atual.

## UC-35 — Reabrir problema técnico

| Campo          | Descrição                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                                               |
| Interesses     | Retomar um problema preservando seu histórico anterior.                                           |
| Pré-condições  | Registro próprio, do tipo `ISSUE`, com status `RESOLVED`.                                         |
| Gatilho        | O usuário solicita a reabertura.                                                                  |
| Pós-condições  | A data de resolução é removida e o status volta a `OPEN`; conclusão e tentativas são preservadas. |
| Endpoint       | `PATCH /api/technical-entry/:id/reopen`                                                           |

### Fluxo principal

1. O sistema confirma que o registro é um problema resolvido do usuário.
2. O sistema remove a data de resolução.
3. O sistema apresenta o problema reaberto.

### Fluxos alternativos

- `LEARNING` ou problema já aberto não pode ser reaberto.
- Registro arquivado ainda pode ser reaberto na implementação atual.

## UC-36 — Arquivar registro técnico

| Campo          | Descrição                                              |
| -------------- | ------------------------------------------------------ |
| Ator principal | Usuário autenticado                                    |
| Interesses     | Retirar um registro das pesquisas padrão sem apagá-lo. |
| Pré-condições  | Registro pertencente ao usuário.                       |
| Gatilho        | O usuário solicita o arquivamento.                     |
| Pós-condições  | O registro recebe data de arquivamento.                |
| Endpoint       | `PATCH /api/technical-entry/:id/archive`               |

### Fluxo principal

1. O sistema confirma a propriedade do registro.
2. O sistema registra o arquivamento.
3. O sistema apresenta o estado resultante.

### Fluxos alternativos

- Se já estiver arquivado, a operação é idempotente.
- Não há caso de uso ou endpoint de restauração no código atual.

## UC-37 — Excluir registro técnico

| Campo          | Descrição                                                                            |
| -------------- | ------------------------------------------------------------------------------------ |
| Ator principal | Usuário autenticado                                                                  |
| Interesses     | Remover definitivamente um registro e seus detalhes dependentes.                     |
| Pré-condições  | Registro pertencente ao usuário.                                                     |
| Gatilho        | O usuário solicita a exclusão.                                                       |
| Pós-condições  | Registro, tentativas e atribuições de tags são excluídos; tags e projeto permanecem. |
| Endpoint       | `DELETE /api/technical-entry/:id`                                                    |

### Fluxo principal

1. O sistema confirma a propriedade do registro.
2. O sistema exclui o registro e seus detalhes dependentes.
3. O sistema confirma sem conteúdo.

### Fluxos alternativos

- Registro arquivado também pode ser excluído.

## UC-38 — Atribuir tag ao registro

| Campo          | Descrição                                              |
| -------------- | ------------------------------------------------------ |
| Ator principal | Usuário autenticado                                    |
| Interesses     | Classificar um registro usando uma tag própria.        |
| Pré-condições  | Registro e tag pertencem ao mesmo usuário autenticado. |
| Gatilho        | O usuário escolhe a tag para o registro.               |
| Pós-condições  | A associação registro–tag existe.                      |
| Endpoint       | `POST /api/technical-entry/:entryId/tags`              |

### Fluxo principal

1. O sistema confirma a propriedade do registro e da tag.
2. O sistema verifica a associação.
3. Se ausente, o sistema cria a associação.
4. O sistema apresenta a tag atribuída.

### Fluxos alternativos

- Se a associação já existir, a operação é idempotente e apenas apresenta a tag.
- Registro arquivado ainda aceita atribuição na implementação atual.

## UC-39 — Remover tag do registro

| Campo          | Descrição                                              |
| -------------- | ------------------------------------------------------ |
| Ator principal | Usuário autenticado                                    |
| Interesses     | Retirar uma classificação sem excluir tag ou registro. |
| Pré-condições  | Registro e tag pertencem ao usuário.                   |
| Gatilho        | O usuário solicita a remoção da associação.            |
| Pós-condições  | A associação registro–tag não existe.                  |
| Endpoint       | `DELETE /api/technical-entry/:entryId/tags/:tagId`     |

### Fluxo principal

1. O sistema confirma a propriedade do registro e da tag.
2. Se existir, o sistema remove a associação.
3. O sistema confirma sem conteúdo.

### Fluxos alternativos

- Associação já ausente é tratada como sucesso idempotente.
- Registro arquivado ainda aceita remoção de tag.

## UC-40 — Adicionar tentativa de solução

| Campo          | Descrição                                                 |
| -------------- | --------------------------------------------------------- |
| Ator principal | Usuário autenticado                                       |
| Interesses     | Documentar um experimento e seu resultado em um problema. |
| Pré-condições  | Registro próprio, do tipo `ISSUE` e não arquivado.        |
| Gatilho        | O usuário informa descrição e resultado.                  |
| Pós-condições  | Uma tentativa passa a compor o registro.                  |
| Endpoint       | `POST /api/technical-entry/:entryId/solution-attempts`    |

### Fluxo principal

1. O sistema confirma propriedade, tipo e arquivamento do registro.
2. O sistema valida descrição e resultado.
3. O sistema registra e apresenta a tentativa.

### Fluxos alternativos

- `LEARNING`, registro arquivado ou dados inválidos impedem a inclusão.
- Um `ISSUE` já resolvido ainda pode receber nova tentativa se não estiver
  arquivado.

## UC-41 — Listar tentativas de solução

| Campo          | Descrição                                                     |
| -------------- | ------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                           |
| Interesses     | Revisar experimentos de um registro, inclusive por resultado. |
| Pré-condições  | Registro pertencente ao usuário.                              |
| Gatilho        | O usuário solicita as tentativas com critérios opcionais.     |
| Pós-condições  | Nenhuma alteração de estado.                                  |
| Endpoint       | `GET /api/technical-entry/:entryId/solution-attempts`         |

### Fluxo principal

1. O sistema confirma a propriedade do registro.
2. O sistema filtra por resultado, pagina e ordena.
3. O sistema apresenta a página de tentativas.

### Fluxos alternativos

- Registro arquivado continua consultável.
- Sem correspondências, a página é vazia.

## UC-42 — Atualizar tentativa de solução

| Campo          | Descrição                                                              |
| -------------- | ---------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                    |
| Interesses     | Corrigir a descrição de uma tentativa no registro correto.             |
| Pré-condições  | Registro próprio contendo a tentativa.                                 |
| Gatilho        | O usuário informa a nova descrição.                                    |
| Pós-condições  | Descrição e data de atualização são alteradas; resultado é preservado. |
| Endpoint       | `PATCH /api/technical-entry/:entryId/solution-attempts/:attemptId`     |

### Fluxo principal

1. O sistema confirma a propriedade do registro.
2. O sistema confirma que a tentativa pertence ao registro indicado.
3. O sistema valida e atualiza a descrição.
4. O sistema apresenta a tentativa.

### Fluxos alternativos

- Tentativa de outro registro é tratada como não encontrada.
- Registro arquivado não impede esta atualização no código atual.
- O resultado não é editável por esse endpoint.

## UC-43 — Remover tentativa de solução

| Campo          | Descrição                                                           |
| -------------- | ------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                 |
| Interesses     | Retirar uma tentativa registrada no problema correto.               |
| Pré-condições  | Registro próprio contendo a tentativa.                              |
| Gatilho        | O usuário solicita a remoção.                                       |
| Pós-condições  | A tentativa é excluída; o registro permanece.                       |
| Endpoint       | `DELETE /api/technical-entry/:entryId/solution-attempts/:attemptId` |

### Fluxo principal

1. O sistema confirma a propriedade do registro e o vínculo da tentativa.
2. O sistema exclui a tentativa.
3. O sistema confirma sem conteúdo.

### Fluxos alternativos

- Tentativa fora do registro é tratada como não encontrada.
- Registro arquivado não impede esta remoção no código atual.
