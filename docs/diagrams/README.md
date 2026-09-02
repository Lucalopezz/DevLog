# Diagramas da API DevLog

Os modelos desta pasta foram extraídos da API atual e usam duas notações:

- [casos de uso em PlantUML](use-cases/devlog-use-cases.puml), porque PlantUML
  representa atores, fronteira, generalização, `include` e `extend` de forma
  mais fiel à UML;
- [classes em Mermaid](classes.md), porque o diagrama fica renderizável junto
  do Markdown e fácil de versionar;
- diagramas de sequência em Mermaid, separados em
  [conta e tags](sequences/account-and-tags.md),
  [projetos](sequences/projects.md) e
  [registros técnicos](sequences/technical-entries.md).

## Por que manter a fonte textual

A fonte é o artefato principal: pode ser revisada em pull requests, atualizada
junto com o código e renderizada em diferentes formatos. Imagens geradas não
foram versionadas para evitar divergência entre fonte e figura.

## Como renderizar

Blocos Mermaid são renderizados automaticamente por GitHub, GitLab e editores
compatíveis. Para PlantUML, abra o arquivo `.puml` em uma extensão compatível ou
execute, caso o CLI esteja instalado:

```bash
plantuml -tsvg docs/diagrams/use-cases/devlog-use-cases.puml
```

O ambiente atual possui Java, mas não possui o executável PlantUML; por isso a
validação local verifica a sintaxe estrutural da fonte sem gerar SVG.

## Níveis de abstração

- Caso de uso: visão externa, sem controllers ou banco.
- Sequência: visão de projeto, com responsabilidades entre camadas.
- Classes de domínio: estrutura e regras de negócio.
- Classes técnicas: dependências arquiteturais, mantidas separadas do domínio.

Consulte também os [casos de uso textuais](../usecases/README.md) e a
[rastreabilidade dos endpoints](../usecases/traceability.md).
