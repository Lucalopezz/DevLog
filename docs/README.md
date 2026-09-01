# Documentação do DevLog

Este diretório reúne as decisões, explicações e planos de implementação do
DevLog. A documentação foi organizada para apoiar tanto quem está conhecendo o
projeto quanto quem está estudando uma parte específica da aplicação.

## Tenho uma dúvida. Onde procuro?

Use a tabela abaixo como ponto de entrada. Em geral, a resposta já está em um
dos arquivos indicados:

| Dúvida                                                                               | Arquivo recomendado                                                            |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Quero entender o objetivo, o escopo e as decisões gerais do produto                  | [`decisions/devlog-decisoes.md`](decisions/devlog-decisoes.md)                 |
| Quero saber como o banco foi modelado e por que as tabelas se relacionam dessa forma | [`decisions/database.md`](decisions/database.md)                               |
| Quero saber o que o sistema deve fazer                                               | [`usecases/cases.md`](usecases/cases.md)                                       |
| Quero saber o que ainda falta implementar no backend                                 | [`backlog/backend.md`](backlog/backend.md)                                     |
| Quero configurar o ambiente e conectar a API ao PostgreSQL                           | [`guides/configs_workflow.md`](guides/configs_workflow.md)                     |
| Quero entender ou implementar autenticação                                           | [`guides/authentication_workflow.md`](guides/authentication_workflow.md)       |
| Quero entender a validação das entidades                                             | [`guides/entity_validation_workflow.md`](guides/entity_validation_workflow.md) |
| Quero entender onde ficam e como executar os testes                                  | [`guides/testing.md`](guides/testing.md)                                       |
| Quero entender como os módulos do backend são organizados                            | [`guides/backend_structure.md`](guides/backend_structure.md)                   |
| Quero entender a estrutura do monorepo                                               | [`guides/monorepo.md`](guides/monorepo.md)                                     |
| Procuro comandos usados com frequência                                               | [`guides/utils.md`](guides/utils.md)                                           |
| Quero consultar anotações de modelagem feitas durante o estudo                       | [`anotations.md`](anotations.md)                                               |

Se a dúvida for sobre como iniciar o projeto, consulte primeiro o
[README da raiz](../README.md). Ele contém os pré-requisitos, a instalação e
os comandos principais.

## Como a documentação está organizada

### `decisions/`

Registra decisões de produto, arquitetura e banco de dados. Consulte esses
arquivos quando a pergunta for “por que o projeto foi estruturado assim?”.

### `guides/`

Explica fluxos técnicos e procedimentos passo a passo. Consulte essa pasta
quando a pergunta for “como essa parte funciona ou deve ser implementada?”.

### `usecases/`

Descreve o comportamento esperado do sistema e as regras dos casos de uso.
Consulte essa pasta antes de alterar o comportamento de uma funcionalidade.

### `backlog/`

Mostra o estado planejado da implementação e as pendências conhecidas.
Consulte essa pasta quando a pergunta for “o que ainda precisa ser feito?”.

## Como manter a documentação útil

- Antes de criar um novo documento, verifique se a dúvida pode ser respondida
  em um arquivo existente.
- Ao criar um documento novo, adicione-o à tabela acima e indique em que pasta
  ele se encaixa.
- Diferencie uma decisão já tomada de uma ideia ou tarefa futura.
- Quando uma implementação mudar, atualize também o documento que descreve o
  comportamento afetado.

## Ordem sugerida para quem está chegando

1. Leia o [README da raiz](../README.md) para executar o projeto.
2. Leia [`decisions/devlog-decisoes.md`](decisions/devlog-decisoes.md) para
   entender o produto.
3. Consulte [`usecases/cases.md`](usecases/cases.md) para entender as regras.
4. Escolha um guia técnico relacionado à dúvida.
5. Confira [`backlog/backend.md`](backlog/backend.md) antes de implementar uma
   nova tarefa.
