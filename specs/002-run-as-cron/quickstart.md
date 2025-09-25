# Quickstart: Running the Sync Cron Job Locally

This guide explains how to run the data synchronization process locally, simulating a cron job execution.

## Prerequisites

-   Node.js and pnpm installed.
-   A `.env` file with the required API keys (see `.env.example`).

## Steps

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```

2.  **Run the sync process**:
    ```bash
    pnpm --filter export-ofx sync
    ```

3.  **Verify the sync**:
    -   Check the console output for success or error messages.
    -   Check your YNAB account for new transactions.