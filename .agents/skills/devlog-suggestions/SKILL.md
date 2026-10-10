---
name: devlog-suggestions
description: "Surface useful suggestions and decision questions during DevLog planning or implementation, and invite the user's input without stalling independent work."
---

# DevLog Suggestions

Keep the user involved in meaningful choices throughout an implementation task.
Read [repository instructions](../../../AGENTS.md), the request, accepted
preferences, and relevant project decisions before raising a question. Use the
user's conversation language; repository artifacts remain in English.

## During planning

Identify the intended outcome, existing contracts, and decisions that the current
context does not settle. Offer a useful improvement when it fits the requested
work, and invite the user's preferences or additional suggestions when they can
materially affect the result. A clear, routine request can proceed without a
ritual question.

Each decision question should explain:

- The concrete choice and why it matters now.
- The recommended option and its relevant trade-off.
- A small number of reasonable alternatives, or a focused free-text question
  when product details cannot be reduced to options.

Examples include whether a filter should survive refresh through URL state,
whether an action archives or permanently deletes a record, or how a duplicate
name should behave. First check whether the project already answers the question;
do not reopen an accepted decision simply because alternatives exist.

## During implementation

Raise newly discovered doubts when evidence changes the plan: an API/schema
mismatch, ambiguous business rule, conflicting acceptance criteria, migration
that affects existing data, or a useful UX choice with different outcomes.
Surface the evidence close to the discovery, not solely in the final report.

Use the environment's question tool when available. Prefer asynchronous questions
so independent authorized work can continue. Bundle related decisions, keep them
concise and self-contained, and recommend an option. If no question tool is
available, clearly request the missing input in the next user-facing response.

Distinguish required input from optional feedback:

- If an unresolved choice changes business behavior, public contracts, data loss,
  or authorization in a way the task does not settle, keep dependent work pending.
  Prepare concrete alternatives or a reviewable artifact and continue independent
  work. Silence is not approval or a missing required answer.
- For an optional improvement with a safe existing default, give the user a
  reasonable opportunity to reply. If no reply arrives, continue with the
  established behavior or the stated default and report the assumption.
- Resolve routine implementation details autonomously and explain consequential
  decisions. Do not request repeated confirmation for already authorized work.

Suggestions outside the request remain proposals. Explain their benefit and cost
without implementing them as hidden scope expansion. Avoid blanket hardening,
new dependencies, or architectural rewrites justified only by hypothetical risk.

## Close the loop

Incorporate answers into the active task and update the plan or implementation.
Summarize accepted choices, material assumptions, and any unresolved proposal in
the final response when relevant. The skill supports continuous collaboration;
it does not replace completing the user's requested work with a list of ideas.
