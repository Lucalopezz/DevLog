# Casos de uso — conta, autenticação e tags

As falhas de validação mencionadas abaixo incluem formato, tamanho e campos
obrigatórios. As regras transversais estão no [índice](README.md).

## UC-01 — Cadastrar usuário

| Campo          | Descrição                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------- |
| Ator principal | Visitante                                                                                   |
| Interesses     | O visitante quer criar sua conta; o sistema precisa manter e-mail único e proteger a senha. |
| Pré-condições  | O visitante não precisa estar autenticado.                                                  |
| Gatilho        | O visitante envia nome, e-mail, senha e confirmação.                                        |
| Pós-condições  | Uma conta é criada com senha armazenada como hash; a senha não é devolvida.                 |
| Endpoint       | `POST /api/users`                                                                           |

### Fluxo principal

1. O visitante informa seus dados.
2. O sistema confirma que as duas senhas são iguais.
3. O sistema confirma que o e-mail ainda não está cadastrado.
4. O sistema protege a senha e registra a conta.
5. O sistema apresenta os dados públicos do usuário.

### Fluxos alternativos

- 2a. As senhas divergem: o sistema rejeita o cadastro.
- 3a. O e-mail já existe: o sistema informa conflito e não cria outra conta.
- 1a. Algum dado é inválido: o sistema informa os erros de validação.

## UC-02 — Autenticar usuário

| Campo          | Descrição                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Ator principal | Visitante                                                                                                             |
| Interesses     | O visitante quer acessar seus dados; o sistema deve aceitar apenas credenciais válidas sem revelar qual campo falhou. |
| Pré-condições  | Deve existir uma conta correspondente.                                                                                |
| Gatilho        | O visitante informa e-mail e senha.                                                                                   |
| Pós-condições  | Um token temporário é enviado em cookie HttpOnly e os dados públicos do usuário são apresentados.                     |
| Endpoint       | `POST /api/auth/login`                                                                                                |

### Fluxo principal

1. O visitante informa as credenciais.
2. O sistema localiza a conta pelo e-mail.
3. O sistema compara a senha informada com a senha protegida.
4. O sistema cria uma credencial de acesso vinculada ao usuário.
5. O sistema inicia a sessão no cliente e apresenta o usuário autenticado.

### Fluxos alternativos

- 2a/3a. Conta inexistente ou senha incorreta: o sistema responde apenas
  “Credenciais inválidas”.
- 1a. O formato dos dados é inválido: o sistema rejeita a solicitação.

## UC-03 — Encerrar sessão

| Campo          | Descrição                                                     |
| -------------- | ------------------------------------------------------------- |
| Ator principal | Visitante ou usuário autenticado                              |
| Interesses     | O ator quer que o cliente deixe de enviar a credencial atual. |
| Pré-condições  | Nenhuma; a operação também funciona sem sessão válida.        |
| Gatilho        | O ator solicita logout.                                       |
| Pós-condições  | O cookie de acesso é removido do cliente.                     |
| Endpoint       | `POST /api/auth/logout`                                       |

### Fluxo principal

1. O ator solicita o encerramento da sessão.
2. O sistema instrui o cliente a remover o cookie de acesso.
3. O sistema confirma a operação sem devolver conteúdo.

### Fluxos alternativos

- Não há fluxo de revogação no servidor; um token copiado antes do logout
  permanece tecnicamente válido até expirar.

## UC-04 — Consultar perfil atual

| Campo          | Descrição                                                                       |
| -------------- | ------------------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                             |
| Interesses     | O usuário quer consultar seus dados públicos; o sistema não deve expor a senha. |
| Pré-condições  | Requisição autenticada.                                                         |
| Gatilho        | O usuário solicita seu perfil.                                                  |
| Pós-condições  | O estado do sistema não muda.                                                   |
| Endpoint       | `GET /api/users/me`                                                             |

### Fluxo principal

1. O usuário solicita o próprio perfil.
2. O sistema localiza a conta identificada pela sessão.
3. O sistema apresenta identificador, nome, e-mail e datas.

### Fluxos alternativos

- 2a. A conta da sessão não existe mais: o sistema informa que o usuário não
  foi encontrado.
- A autenticação ausente ou inválida interrompe o caso antes do passo 1.

## UC-05 — Atualizar perfil

| Campo          | Descrição                                                         |
| -------------- | ----------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                               |
| Interesses     | O usuário quer alterar seu nome mantendo sua identidade e e-mail. |
| Pré-condições  | Requisição autenticada e conta existente.                         |
| Gatilho        | O usuário informa o novo nome.                                    |
| Pós-condições  | O nome e a data de atualização são alterados.                     |
| Endpoint       | `PATCH /api/users/me`                                             |

### Fluxo principal

1. O usuário informa o novo nome.
2. O sistema localiza sua conta.
3. O sistema valida e registra o novo nome.
4. O sistema apresenta o perfil atualizado.

### Fluxos alternativos

- 2a. A conta não existe: o sistema informa que o usuário não foi encontrado.
- 3a. O nome é inválido: nada é alterado e os erros são apresentados.

## UC-06 — Alterar senha

| Campo          | Descrição                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                                                     |
| Interesses     | O usuário quer trocar a senha; o sistema deve confirmar sua identidade e nunca persistir senha legível. |
| Pré-condições  | Requisição autenticada e conta existente.                                                               |
| Gatilho        | O usuário informa senha atual, nova senha e confirmação.                                                |
| Pós-condições  | A nova senha protegida substitui a anterior.                                                            |
| Endpoint       | `PATCH /api/users/me/password`                                                                          |

### Fluxo principal

1. O usuário informa as três senhas.
2. O sistema confirma que nova senha e confirmação coincidem.
3. O sistema valida a senha atual.
4. O sistema protege e registra a nova senha.
5. O sistema apresenta o perfil atualizado.

### Fluxos alternativos

- 2a. Nova senha e confirmação divergem: a troca é rejeitada.
- 3a. A senha atual é inválida: a troca é rejeitada.
- 1a. A conta não existe ou os dados são inválidos: nada é alterado.

## UC-07 — Criar tag

| Campo          | Descrição                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                                                             |
| Interesses     | O usuário quer criar uma classificação reutilizável; o sistema deve evitar duplicatas equivalentes por usuário. |
| Pré-condições  | Requisição autenticada.                                                                                         |
| Gatilho        | O usuário informa o nome da tag.                                                                                |
| Pós-condições  | Uma tag normalizada pertencente ao usuário é criada.                                                            |
| Endpoint       | `POST /api/tag`                                                                                                 |

### Fluxo principal

1. O usuário informa o nome.
2. O sistema normaliza o nome para comparação.
3. O sistema confirma que não existe tag equivalente desse usuário.
4. O sistema cria e apresenta a tag.

### Fluxos alternativos

- 3a. Já existe uma tag com o nome normalizado: o sistema informa conflito.
- 1a. Nome inválido ou conta inexistente: a tag não é criada.

## UC-08 — Pesquisar tags

| Campo          | Descrição                                                                  |
| -------------- | -------------------------------------------------------------------------- |
| Ator principal | Usuário autenticado                                                        |
| Interesses     | O usuário quer localizar suas classificações sem visualizar tags alheias.  |
| Pré-condições  | Requisição autenticada.                                                    |
| Gatilho        | O usuário solicita a lista, opcionalmente com nome, paginação e ordenação. |
| Pós-condições  | O estado do sistema não muda.                                              |
| Endpoint       | `GET /api/tag`                                                             |

### Fluxo principal

1. O usuário informa os critérios opcionais.
2. O sistema restringe a pesquisa às tags do usuário.
3. O sistema aplica filtro, paginação e ordenação.
4. O sistema apresenta itens e metadados de paginação.

### Fluxos alternativos

- 3a. Nenhuma tag corresponde: o sistema apresenta uma página vazia.
- 1a. Algum critério é inválido: a pesquisa é rejeitada.

## UC-09 — Excluir tag

| Campo          | Descrição                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Ator principal | Usuário autenticado                                                                                    |
| Interesses     | O usuário quer remover uma classificação própria; registros classificados devem permanecer existentes. |
| Pré-condições  | Requisição autenticada e tag pertencente ao usuário.                                                   |
| Gatilho        | O usuário escolhe excluir a tag.                                                                       |
| Pós-condições  | A tag e seus vínculos com registros são removidos; os registros permanecem.                            |
| Endpoint       | `DELETE /api/tag/:id`                                                                                  |

### Fluxo principal

1. O usuário indica a tag.
2. O sistema confirma sua propriedade.
3. O sistema exclui a tag e suas atribuições.
4. O sistema confirma sem devolver conteúdo.

### Fluxos alternativos

- 2a. A tag não existe ou pertence a outro usuário: o sistema responde como
  tag não encontrada.
