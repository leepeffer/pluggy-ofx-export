# Data Model

This feature does not introduce any new persistent data models. The configuration for the cron job will be managed through environment variables on Render.com.

## Key Configuration (Environment Variables)

-   `CRON_SCHEDULE`: The cron schedule expression (e.g., `0 0 * * *`).
-   `PLUGGY_CLIENT_ID`: The Pluggy API client ID.
-   `PLUGGY_CLIENT_SECRET`: The Pluggy API client secret.
-   `YNAB_ACCESS_TOKEN`: The YNAB API access token.
-   `MOCK_ACCOUNT_CONFIG`: The path to the mock account configuration file.