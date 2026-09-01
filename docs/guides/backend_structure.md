# Organização dos módulos do backend

## Regra principal

O backend mantém as camadas `application`, `domain` e `infrastructure` como
primeiro nível de organização. Quando um módulo passa a concentrar várias
capacidades relacionadas, cada camada cria subpastas com os mesmos nomes.

No módulo `project`, por exemplo, as capacidades são `project`, `command`,
`resource` e `technology`:

```text
project/
  application/usecases/{project,command,resource,technology}/
  domain/entities/{project,command,resource,technology}/
  domain/repositories/{project,command,resource,technology}/
  infrastructure/database/prisma/repositories/{project,command,resource,technology}/
```

Essa é uma organização por **camada e depois por capacidade**. Ela não torna
cada subpasta automaticamente um agregado de DDD. `Project` continua sendo a
raiz do agregado; as outras pastas reúnem o código relacionado às entidades e
operações subordinadas.

## Quando criar uma subpasta

Crie a subpasta quando houver uma capacidade reconhecível com vários artefatos,
como entidade, validador, contrato de repositório, casos de uso, DTOs ou
implementação Prisma. Use o mesmo nome nas camadas em que essa capacidade
existir.

Não crie diretórios vazios e não aplique a regra preventivamente a módulos
pequenos. `user`, `tag` e `auth`, por exemplo, podem continuar planos enquanto
isso tornar a navegação mais simples.

Relacionamentos que não são entidades independentes devem receber nomes de
capacidade. No módulo `technical-entry`, a associação com tags fica em
`tag-assignment`, evitando confusão com o módulo de negócio `tag`.

## Testes

Os testes acompanham a capacidade protegida e seguem o padrão definido no guia
de testes:

```text
capacidade/
  arquivo.ts
  __tests__/
    unit/
      arquivo.spec.ts
    int/
      arquivo.int.spec.ts
```

Assim, o tipo do teste continua explícito sem separar o teste do código que ele
protege.

## Dependências

- Prefira imports diretos; não crie arquivos `index.ts` apenas para encurtar o
  caminho.
- Uma capacidade pode depender do contrato de outra quando a regra de negócio
  exigir, mas a pasta do arquivo deve representar sua responsabilidade
  principal.
- Mover arquivos entre capacidades não deve alterar rotas HTTP, contratos de
  injeção, schemas do banco ou comportamento do domínio.
