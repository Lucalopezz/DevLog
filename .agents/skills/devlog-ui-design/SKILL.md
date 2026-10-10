---
name: devlog-ui-design
description: "Create or change DevLog screens and interactions with existing theme tokens, shadcn composition, and accessible UI patterns."
---

# DevLog UI Design

Inspect the closest existing screen, [theme tokens](../../../apps/web/src/index.css),
[shadcn configuration](../../../apps/web/components.json), and
[frontend organization](../../../docs/guides/frontend_structure.md). Build on
the current interface unless the user requests a redesign.

## Compose the interface

- Reuse existing semantic theme utilities such as `bg-card`, `text-muted-foreground`,
  and `border-border` instead of assigning independent colors to each screen.
  Check both light and dark appearances when affected.
- Use Tailwind spacing and sizing tokens. Follow the repository's `rem` rule for
  custom dimensions and its language and locale requirements.
- Add or update shadcn library primitives through its CLI as required by
  [AGENTS.md](../../../AGENTS.md). Check available generated components first.
  Custom domain composition is allowed; do not handwrite a substitute primitive
  when the CLI fails. Follow the repository's stopping instruction in that case.
- Match the hierarchy of comparable screens: page title and description,
  primary action, filters, content, and secondary actions. Keep domain labels,
  colors, and formats in the feature's presentation layer when shared.
- Make icon-only controls accessible by name. Associate form labels and errors
  with inputs, preserve keyboard operation and visible focus, and use dialog
  titles and descriptions appropriate to the action.

## Design the complete interaction

Consider initial loading, background updates, empty results, recoverable errors,
pending writes, success, and retry only where they apply. Distinguish an empty
workspace from a filter that matches nothing. A failed request must not look
like an empty result.

Preserve a form draft after a failed save. Explain disabled controls and avoid
duplicate submissions. Follow existing confirmation patterns for destructive
actions; make the actual consequence clear to the user. Present feedback once
at the layer already responsible for it.

Check narrow layouts, long titles, overflowing content, and reachable actions.
Use an actual browser when changing navigation, focus, dialog behavior, or
responsive interactions. Perform relevant focused tests and the required web
lint and build checks; report any browser verification that could not run.

Explain meaningful design decisions in terms of hierarchy, consistency, and
accessibility. Keep implementation terminology out of product copy unless it
helps the person using DevLog make a decision.
