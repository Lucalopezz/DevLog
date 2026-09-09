# DevLog API diagrams

The models in this directory were derived from the current API and use two notations:

- [PlantUML use cases](use-cases/devlog-use-cases.puml), because PlantUML represents actors, boundaries, generalization, `include`, and `extend` more faithfully to UML;
- [Mermaid classes](classes.md), because the diagram renders alongside Markdown and is easy to version;
- Mermaid sequence diagrams, grouped into [account and tags](sequences/account-and-tags.md), [projects](sequences/projects.md), and [technical entries](sequences/technical-entries.md).

## Why keep text sources

The source is the main artifact: it can be reviewed in pull requests, updated alongside code, and rendered in different formats. Generated images are not versioned here to avoid divergence between source and rendering.

## Rendering

Mermaid blocks render automatically on GitHub, GitLab, and compatible editors. For PlantUML, open the `.puml` file in a compatible extension or run this command if the CLI is installed:

```bash
plantuml -tsvg docs/diagrams/use-cases/devlog-use-cases.puml
```

The environment used to prepare these diagrams had Java but no PlantUML executable, so local validation checked the source structure without generating SVG.

## Abstraction levels

- Use cases: external view, without controllers or a database.
- Sequences: design view, showing responsibilities across layers.
- Domain classes: structure and business rules.
- Technical classes: architectural dependencies, kept separate from the domain.

See also the [textual use cases](../usecases/README.md) and [endpoint traceability](../usecases/traceability.md).
