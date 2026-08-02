# Fluxo de validação de entidades

Este documento explica como a validação de domínio funciona atualmente na API do DevLog, usando `UserEntity` como exemplo.

## Visão geral

O fluxo atual pode ser representado assim:

```text
UserEntity
   ↓
UserValidatorFactory
   ↓
UserValidator
   ↓
UserRules + decorators do class-validator
   ↓
ClassValidatorFields.validate()
   ↓
FieldsError
   ↓
EntityValidationError
```

A responsabilidade de cada parte é diferente:

1. `UserRules` declara as regras específicas de um usuário.
2. `ClassValidatorFields` executa as regras e organiza os erros.
3. `UserValidator` conecta as regras de usuário ao validador genérico.
4. `UserEntity` impede que uma entidade inválida seja criada ou atualizada.
5. `EntityValidationError` transporta os erros para a camada que chamou a entidade.

## 1. O formato `FieldsError`

O arquivo [`validators-fields.interface.ts`](../../apps/api/src/shared/domain/validators/validators-fields.interface.ts) define o formato dos erros:

```ts
export type FieldsError = {
  [field: string]: string[];
};
```

O objeto usa o nome do campo como chave e uma lista de mensagens como valor:

```ts
{
  name: ['O nome é obrigatório'],
  email: ['O e-mail deve ser válido'],
  password: ['A senha é obrigatória']
}
```

Um campo usa `string[]`, e não apenas `string`, porque mais de uma regra pode falhar ao mesmo tempo. Por exemplo, um valor pode estar vazio e também não respeitar outro requisito.

A mesma interface define o contrato que os validadores devem seguir:

```ts
export interface ValidatorsFieldsInterface<PropsValidated extends object> {
  errors: FieldsError | null;
  validatedData: PropsValidated | null;
  validate(data: PropsValidated): boolean;
}
```

Assim, um validador informa três coisas:

- se os dados são válidos, pelo retorno booleano de `validate`;
- quais campos falharam, por meio de `errors`;
- quais dados passaram na validação, por meio de `validatedData`.

## 2. O validador genérico compartilhado

O arquivo [`class-validator-fields.ts`](../../apps/api/src/shared/domain/validators/class-validator-fields.ts) contém a classe abstrata reutilizável:

```ts
export abstract class ClassValidatorFields<
  PropsValidated extends object,
> implements ValidatorsFieldsInterface<PropsValidated> {
  // ...
}
```

Ela não conhece usuários ou qualquer outra entidade. Sua função é executar o `class-validator`:

```ts
const validationErrors = validateSync(data);
```

Antes de validar, ela limpa o estado anterior:

```ts
this.errors = null;
this.validatedData = null;
```

Isso é importante porque uma mesma instância de validador poderia ser reutilizada. Sem essa limpeza, erros de uma validação anterior poderiam permanecer na próxima validação.

Quando existem erros, o `class-validator` retorna objetos com várias informações internas. A classe compartilhada transforma esses objetos no formato simples de `FieldsError`:

```ts
this.errors = validationErrors.reduce<FieldsError>((acc, error) => {
  acc[error.property] = Object.values(error.constraints ?? {});
  return acc;
}, {});
```

Em outras palavras:

```text
erros internos do class-validator
        ↓
nome da propriedade + mensagens das constraints
        ↓
FieldsError
```

Se não houver erro, os dados validados são armazenados e o método retorna `true`:

```ts
this.validatedData = data;
return true;
```

Se houver erro, o método armazena `errors` e retorna `false`.

## 3. As regras específicas de `User`

O arquivo [`user.validator.ts`](../../apps/api/src/user/domain/validators/user.validator.ts) declara a classe `UserRules`.

Ela contém os decorators do `class-validator`:

```ts
@MaxLength(120, {
  message: 'O nome deve ter no máximo 120 caracteres',
})
@IsString({ message: 'O nome deve ser um texto' })
@IsNotEmpty({ message: 'O nome é obrigatório' })
name: string;
```

Esses decorators descrevem as regras do campo `name`. O mesmo acontece com `email`, `password`, `createdAt` e `updatedAt`.

`UserRules` não herda de `ClassValidatorFields`. Ela é apenas o objeto que recebe os decorators. A classe compartilhada é quem executa esses decorators.

Seu construtor copia as propriedades recebidas:

```ts
constructor({ name, email, password, createdAt, updatedAt }: UserProps) {
  Object.assign(this, { name, email, password, createdAt, updatedAt });
}
```

Essa instância é necessária porque o `class-validator` lê os metadados dos decorators a partir da classe `UserRules`.

## 4. O papel de `UserValidator`

`UserValidator` especializa o validador compartilhado:

```ts
export class UserValidator extends ClassValidatorFields<UserRules> {
  validate(data: UserRules): boolean {
    return super.validate(new UserRules(data));
  }
}
```

O propósito dessa classe é adaptar os dados de usuário para o formato esperado pelas regras:

```text
UserProps
   ↓
new UserRules(data)
   ↓
ClassValidatorFields.validate()
```

A factory cria o validador:

```ts
export class UserValidatorFactory {
  static create(): UserValidator {
    return new UserValidator();
  }
}
```

Hoje a factory é simples, mas mantém a entidade desacoplada da forma concreta de construção do validador. Caso futuramente sejam necessárias dependências ou outra implementação, a criação pode mudar sem alterar o uso na entidade.

## 5. A entidade protege o estado do domínio

O arquivo [`user.entity.ts`](../../apps/api/src/user/domain/entities/user.entity.ts) chama a validação no construtor:

```ts
constructor(
  public readonly props: UserProps,
  id?: string,
) {
  UserEntity.validate(props);
  super(props, id);
}
```

Isso significa que uma `UserEntity` só pode ser criada se seus dados forem válidos.

O método estático centraliza a integração com o validador:

```ts
static validate(props: UserProps): void {
  const userValidator = UserValidatorFactory.create();
  const isValid = userValidator.validate(props);

  if (!isValid) {
    throw new EntityValidationError(userValidator.errors ?? {});
  }
}
```

O fluxo de falha é:

```text
UserEntity.validate(props)
        ↓
validator.validate(props) === false
        ↓
userValidator.errors
        ↓
throw new EntityValidationError(errors)
```

A entidade não retorna uma entidade parcialmente válida. Ela interrompe a operação lançando uma exceção.

A validação também é executada durante alterações que podem modificar o estado:

```ts
updateName(name?: string): void {
  const updatedProps = {
    ...this.props,
    ...(name !== undefined && { name }),
  };

  UserEntity.validate(updatedProps);

  // alteração aplicada somente depois da validação
}
```

Primeiro são montadas as propriedades futuras e validadas. Só depois o valor é aplicado. Essa ordem evita deixar a entidade em um estado inválido quando uma atualização falha.

## 6. O erro de domínio

O arquivo [`entity-validation-error.ts`](../../apps/api/src/shared/domain/errors/entity-validation-error.ts) define o erro lançado pela entidade:

```ts
export class EntityValidationError extends Error {
  constructor(public error: FieldsError) {
    super('Entity validation error');
    this.name = 'EntityValidationError';
  }
}
```

Existem duas informações diferentes nesse erro:

```ts
error.message
```

contém a mensagem geral:

```text
Entity validation error
```

Já:

```ts
error.error
```

contém os detalhes por campo:

```ts
{
  email: ['O e-mail deve ser válido'],
  password: ['A senha é obrigatória']
}
```

Portanto, a mensagem geral não substitui as mensagens dos campos. Ela identifica o tipo geral do problema, enquanto a propriedade `error` preserva os detalhes.

Um código que capture a exceção pode acessar as duas informações:

```ts
try {
  new UserEntity(props);
} catch (error) {
  if (error instanceof EntityValidationError) {
    console.log(error.message);
    console.log(error.error);
  }
}
```

## 7. O que acontece atualmente na API HTTP?

O fluxo de domínio está implementado, mas ainda não está completo na camada HTTP.

Atualmente, o controller de usuário ainda possui métodos vazios:

```ts
@Post()
create(@Body() createUserDto: CreateUserDto) {}
```

Além disso, o `CreateUserDto` ainda não possui propriedades ou regras:

```ts
export class CreateUserDto {}
```

Consequentemente, uma requisição HTTP ainda não percorre todo o fluxo abaixo:

```text
requisição HTTP
   ↓
Controller
   ↓
Use case
   ↓
UserEntity
   ↓
EntityValidationError
   ↓
resposta HTTP formatada
```

Ainda falta implementar o tratamento da exceção na infraestrutura HTTP. Um exception filter ou outro mecanismo de tratamento deverá converter o erro de domínio em uma resposta semelhante a:

```json
{
  "message": "Entity validation error",
  "errors": {
    "email": ["O e-mail deve ser válido"],
    "password": ["A senha é obrigatória"]
  }
}
```

Sem esse tratamento, `error.message` continua sendo apenas `Entity validation error`, e os detalhes ficam disponíveis somente em `error.error` para o código que capturar a exceção.

## 8. Datas recebidas pelo HTTP

As regras de usuário usam `@IsDate()` para `createdAt` e `updatedAt`:

```ts
@IsDate({ message: 'A data de criação deve ser válida' })
createdAt: Date;
```

Uma data criada no código normalmente é um objeto `Date`:

```ts
new Date();
```

Porém, uma requisição HTTP normalmente contém uma string JSON:

```json
{
  "createdAt": "2026-08-01T10:00:00.000Z"
}
```

Antes de criar a entidade, essa string deverá ser convertida para `Date`, ou a camada de entrada deverá usar transformação adequada. Essa conversão pertence à fronteira da aplicação, e não deve ficar escondida dentro da entidade.

## 9. Validações em camadas

O projeto pode possuir validações em mais de uma camada, com responsabilidades diferentes:

```text
DTO
   ↓ valida formato da entrada HTTP
Use case
   ↓ coordena a operação
Entity
   ↓ protege as regras do domínio
Repository
   ↓ persiste os dados
```

A validação da entidade é importante porque a entidade pode ser criada por diferentes entradas, não apenas pelo controller. Mesmo que alguém chame um use case, um teste ou outro adaptador, o domínio continua protegendo suas próprias regras.

Uma diferença importante é:

- DTO: valida a entrada e o formato esperado pela API;
- entidade: valida se o estado é aceitável para o domínio;
- banco de dados: aplica restrições de persistência, como unicidade e existência de registros relacionados.

Essas validações podem se repetir parcialmente, mas não são substitutas perfeitas umas das outras.

## Resumo

O fluxo de validação de usuário atualmente funciona assim:

1. `UserRules` declara as regras com decorators.
2. `UserValidator` cria uma instância de `UserRules`.
3. `ClassValidatorFields` executa o `class-validator`.
4. Os erros são convertidos para `FieldsError`.
5. `UserEntity` interrompe a criação ou atualização quando há erros.
6. `EntityValidationError` recebe os erros detalhados.
7. `error.message` contém apenas a mensagem geral.
8. `error.error` contém os campos e suas mensagens.

O domínio já possui a base da validação. Para exibir esses erros ao cliente HTTP, ainda falta conectar o controller, os DTOs, os use cases e o tratamento de exceções da API.
