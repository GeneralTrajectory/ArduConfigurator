# Outputs Redesign Brief

## Goal

Restructure the Outputs page so it reads as one deliberate workflow instead of a stack of equal-weight cards.

The page should answer four operator questions clearly:

1. Is the current motor/output map coherent?
2. Can I verify order and direction safely?
3. Are ESC protocol and spin-threshold settings reviewed?
4. Are notification/peripheral outputs configured and staged correctly?

## Structural Direction

The Outputs page is organized around:

- a top summary rail
- a persistent output overview column
- a task deck with focused panels
- a sticky review dock when output changes are pending

### Task Deck

- `Motor Setup`
  - mixer preview
  - board-orientation check
  - output assignment editor
- `Direction & Test`
  - guarded motor test
  - guided direction verification
- `ESC & Protocol`
  - ESC calibration/range review
  - key protocol and spin-threshold settings
- `Peripherals & Alerts`
  - LED and buzzer setup
  - additional output-related metadata settings
- `Review`
  - grouped draft review across all output scopes
  - quick links and apply/discard actions per scope

## Non-Regression Rules

The redesign must not remove any existing Outputs capability. The following must remain reachable:

- motor reorder
- output assignment editing
- motor direction verification
- guarded motor test, including `ALL`
- board orientation exercise
- ESC review and ESC/output settings
- LED and buzzer configuration
- additional metadata-backed output settings
- scoped apply/discard actions

## UX Rules

- Keep the current output map visible while moving through tasks.
- Do not show setup, verification, peripherals, and review with equal visual weight.
- Use the review dock only when output-related changes are pending.
- Guided setup and bench shortcuts must still focus the correct Outputs sub-surface.
