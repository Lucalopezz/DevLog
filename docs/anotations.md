 A recomendação, seguindo DDD, é:

  - TechnicalEntry continua sendo uma entidade/agregado.
  - Tag também é uma entidade/agregado próprio.
  - TechnicalEntryTag inicialmente deve ser apenas uma
    tabela de associação, não necessariamente uma
    entidade de domínio.

  - A ação de associar uma tag deve ser executada por um
    use case.

  Uma organização possível:

  src/
  ├── tag/
  │   ├── domain/
  │   │   ├── entities/tag.entity.ts
  │   │   └── repositories/tag.repository.ts
  │   ├── application/
  │   │   └── usecases/
  │   │       ├── create-tag.usecase.ts
  │   │       └── list-tags.usecase.ts
  │   └── infrastructure/
  │       ├── database/prisma/repositories/tag-
  prisma.repository.ts
  │       ├── tag.controller.ts
  │       └── tag.module.ts
  │
  └── technical-entry/
      ├── domain/
      │   └── repositories/
      │       └── technical-entry-tag.repository.ts
      └── application/
          └── usecases/
              ├── assign-tag-to-technical-
              entry.usecase.ts
              └── remove-tag-from-technical-
              entry.usecase.ts

  O use case de associação poderia fazer algo assim:

  async execute(input: {
    userId: string;
    technicalEntryId: string;
    tagId: string;
  }) {
    const entry = await this.entryRepository.findById(
      input.technicalEntryId,
    );

    const tag = await
    this.tagRepository.findById(input.tagId);

    if (!entry || entry.userId !== input.userId) {
      throw new NotFoundException('Entrada não
      encontrada');
    }

    if (!tag || tag.userId !== input.userId) {
      throw new NotFoundException('Tag não encontrada');
    }

    await this.entryTagRepository.add({
      technicalEntryId: entry.id,
      tagId: tag.id,
    });
  }

  O ponto importante é que o use case coordena os dois
  agregados:

  1. Verifica se a entrada pertence ao usuário.
  2. Verifica se a tag pertence ao usuário.
  3. Cria o registro em TechnicalEntryTag.

  Eu não colocaria tagIds diretamente dentro de
  TechnicalEntryEntity neste momento, porque a entidade
  não deveria saber como validar se uma tag existe ou
  pertence ao usuário. Isso é responsabilidade da camada
  de aplicação.

  Também não criaria uma pasta technical-entry-tag agora.
  A tabela tem apenas:

  technicalEntryId
  tagId
  createdAt

  Ela não possui comportamento próprio. Portanto, é uma
  associação de persistência.

  Você pode expor endpoints como:

  POST   /technical-entry/:entryId/tags
  DELETE /technical-entry/:entryId/tags/:tagId
  GET    /tag

  Com o corpo:

  {
    "tagId": "..."
  }

  A entidade TechnicalEntryTag só deveria existir no
  domínio se a associação ganhasse regras próprias, por
  exemplo:

  prioridade da tag
  ordem das tags
  quem adicionou a tag
  data de expiração
  origem da associação

  Nesse caso, ela deixaria de ser apenas uma tabela
  intermediária e passaria a ter comportamento real.

  No seu projeto atual, eu faria estes próximos passos:

  - Renomearia tags.entity.ts para tag.entity.ts.
  - Criaria TagRepository.
  - Criaria TagModule.
  - Criaria um repositório para TechnicalEntryTag.
  - Criaria AssignTagToTechnicalEntryUseCase.
  - Faria TechnicalEntryModule importar TagModule.
  - Retornaria as tags no DTO de uma entrada quando
    necessário.

  A ideia principal é: Tag pertence ao contexto de tags;
  TechnicalEntry pertence ao contexto de entradas; a
  associação entre eles pertence à camada de aplicação e
  é persistida pela tabela intermediária.