# Tasks for: Run as Cron Job

This file breaks down the implementation of the `002-run-as-cron` feature into executable tasks.

## Task List

### Setup Tasks

- **T001: Create `render.yaml` for Cron Job Service**
  - **File**: `/Users/leepeffer/Documents/github/pluggy-ofx-export/render.yaml`
  - **Action**: Create a new file `render.yaml` in the project root. This file will define the cron job service for Render.com, specifying the cron schedule (`0 0 * * *`), the build command (`pnpm install && pnpm --filter core build`), and the start command (`pnpm --filter export-ofx sync`).

### Core Logic Tasks

- **T002: Update Sync Command to Use Environment Variables**
  - **File**: `/Users/leepeffer/Documents/github/pluggy-ofx-export/packages/export-ofx/src/commands/sync.ts`
  - **Action**: Modify the `sync` command to read `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`, `YNAB_ACCESS_TOKEN`, and `MOCK_ACCOUNT_CONFIG` from environment variables if they are present. This will allow the command to be run in a CI/CD environment like Render without a local `.env` file.

### Testing Tasks

- **T003: Create Integration Test for Cron Job Execution [P]**
  - **File**: `/Users/leepeffer/Documents/github/pluggy-ofx-export/packages/export-ofx/test/cron.test.ts`
  - **Action**: Create a new integration test to verify the `sync` command runs successfully when configured entirely through environment variables. This test should mock the necessary environment variables and execute the command, checking for a successful exit code and log output.
  - **Note**: This task is marked as parallel `[P]` as it is a new file and does not have dependencies on other implementation tasks beyond the core logic in `sync.ts` being conceptually ready.

### Documentation Tasks

- **T004: Update README.md with Deployment Instructions [P]**
  - **File**: `/Users/leepeffer/Documents/github/pluggy-ofx-export/README.md`
  - **Action**: Add a new section to the `README.md` file explaining how to deploy the application as a cron job to Render.com using the `render.yaml` file. Include instructions on how to set the required environment variables on the Render dashboard.
  - **Note**: This task is marked as parallel `[P]` and can be worked on at any time.

## Parallel Execution Guide

The following tasks can be executed in parallel:

- `T003: Create Integration Test for Cron Job Execution`
- `T004: Update README.md with Deployment Instructions`

Example of running tasks in parallel:

```bash
# Terminal 1
# Work on T003

# Terminal 2
# Work on T004
```
