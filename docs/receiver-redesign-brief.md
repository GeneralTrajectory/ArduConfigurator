# Receiver Redesign Brief

## Goal
Make the Receiver page feel calm, task-shaped, and deliberate without removing any existing ArduPilot-backed capability.

## Core Problem
The old Receiver page tried to show:
- live telemetry
- RC mapping
- stick range verification
- endpoint calibration
- flight-mode setup
- receiver signal settings
- staged draft review
- advanced metadata-backed settings

All of that was rendered at once, which made the page capable but visually noisy and hard to progress through.

## New Information Architecture
The redesigned Receiver page is split into four layers:

1. Summary rail
   - Mapping
   - Endpoints
   - Flight Modes
   - Signal Setup
   - Review

2. Live monitor
   - primary control channels only by default
   - mode and RSSI context
   - AUX channels behind disclosure

3. Task deck
   - one active setup job at a time
   - Mapping
   - Endpoints
   - Flight Modes
   - Signal Setup
   - Review

4. Review dock
   - sticky bottom apply/review affordance when receiver-related changes are pending

## Design Rules
- Keep the live monitor persistent and legible.
- Default to the primary controls, not the full raw channel wall.
- Hide diagnostics until they are useful.
- Keep advanced settings reachable, but out of the main flow.
- Do not remove any of the existing exercises or parameter editors.
- Prefer one active job at a time over many equal-weight cards.

## Capability Preservation
The redesign keeps:
- guided RC mapping
- stick range exercise
- RC endpoint capture
- mode-channel editing
- flight-mode assignment editing
- switch exercise
- RSSI setup
- additional receiver settings
- draft review/apply/discard flows
- full AUX channel inspection

The change is presentation and workflow hierarchy, not a loss of receiver functionality.
