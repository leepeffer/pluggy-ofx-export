# CLI Contracts

This document defines the command-line interface for the application.

## `pluggy-ofx-export configure`

Configures the connection to Pluggy.ai and YNAB.

### Arguments

-   `--pluggy-api-key <key>`: Your Pluggy.ai API key.
-   `--ynab-api-key <key>`: Your YNAB API key.

### Behavior

-   Stores the API keys securely.
-   Validates the keys by making a simple API call to each service.

## `pluggy-ofx-export sync`

Synchronizes transactions from Pluggy.ai to YNAB.

### Arguments

-   `--account <pluggy_account_id>:<ynab_account_id>`: Maps a Pluggy.ai account to a YNAB account. Can be specified multiple times.
-   `--from <date>`: (Optional) The start date for the synchronization (YYYY-MM-DD). Defaults to the last sync date.

### Behavior

-   Fetches transactions from the specified Pluggy.ai accounts.
-   For each transaction, checks if it has been imported before.
-   If not imported, formats the transaction and sends it to the corresponding YNAB account.
-   Updates the last sync date for the connection.
