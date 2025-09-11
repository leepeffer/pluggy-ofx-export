# Tasks: Connect Pluggy.ai with YNAB API

**Input**: Design documents from `/specs/001-connect-pluggy-ai/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- Paths are relative to the package root (e.g., `packages/core/` or `packages/export-ofx/`)

## Phase 3.1: Setup
- [x] T001 Install `axios` and `pino` dependencies in `packages/core` and `packages/export-ofx`.
- [x] T002 Configure `pino` for structured logging in a new file `packages/core/src/logger.ts`.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T003 [P] Update the failing contract test for the `configure` command in `packages/export-ofx/test/cli.test.ts` to reflect the CLI contract.
- [x] T004 [P] Update the failing contract test for the `sync` command in `packages/export-ofx/test/cli.test.ts` to reflect the CLI contract.
- [x] T005 [P] Create a new failing integration test file `packages/export-ofx/test/integration.test.ts` that covers the main user story from `spec.md`.

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T006 [P] Create data models for User, Connection, and Transaction in `packages/core/src/models.ts` based on `data-model.md`.
- [x] T007 Create a new file `packages/export-ofx/src/commands/configure.ts` and implement the `configure` command logic.
- [x] T008 Create a new file `packages/core/src/ynab-client.ts` and implement a lightweight YNAB API client wrapper using `axios`.
- [x] T009 Create a new file `packages/export-ofx/src/commands/sync.ts` and implement the `sync` command logic.
- [x] T010 Create a new file `packages/core/src/sync.ts` and implement the core synchronization logic, including fetching from Pluggy and posting to YNAB.
- [x] T011 Implement the idempotency check for transactions within `packages/core/src/sync.ts` using the Pluggy transaction ID.

## Phase 3.4: Integration
- [x] T012 Integrate the `pino` logger from `packages/core/src/logger.ts` into the CLI commands.
- [x] T013 Implement secure storage and retrieval of API keys using `dotenv` in the `configure` command.

## Phase 3.5: Polish
- [x] T014 [P] Add unit tests for any utility functions created during implementation.
- [x] T015 [P] Update the root `README.md` with detailed usage instructions for the new feature.

## Dependencies
- T001, T002 (Setup) must be done first.
- T003, T004, T005 (Tests) must be done before T006-T011 (Core Implementation).
- T006 (Models) is a dependency for T010, T011.
- T008 (YNAB Client) is a dependency for T010.

## Parallel Example
```
# The following test creation tasks can be run in parallel:
Task: "T003 [P] Update the failing contract test for the `configure` command in `packages/export-ofx/test/cli.test.ts` to reflect the CLI contract."
Task: "T004 [P] Update the failing contract test for the `sync` command in `packages/export-ofx/test/cli.test.ts` to reflect the CLI contract."
Task: "T005 [P] Create a new failing integration test file `packages/export-ofx/test/integration.test.ts` that covers the main user story from `spec.md`."
```
