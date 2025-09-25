# CLI Contract

This document outlines the command-line interface for the cron job.

## `npm run sync`

This command will trigger the data synchronization process.

### Arguments

-   `--config`: (Optional) Path to a configuration file. Defaults to `mock-account-config.json`.

### Behavior

-   Reads configuration from environment variables and the specified config file.
-   Connects to Pluggy and YNAB APIs.
-   Fetches transactions from Pluggy.
-   Exports transactions to YNAB.
-   Logs the outcome of the sync process.