# Data Model

This document defines the data entities for the "Connect Pluggy.ai with YNAB API" feature.

## Entities

### User

Represents a user of the service.

-   `id`: `string` (unique identifier)
-   `pluggyApiKey`: `string` (encrypted at rest)
-   `ynabApiKey`: `string` (encrypted at rest)

### Connection

Represents the link between a user's Pluggy.ai account and their YNAB account.

-   `id`: `string` (unique identifier)
-   `userId`: `string` (foreign key to User)
-   `pluggyAccountId`: `string` (the ID of the account in Pluggy)
-   `ynabAccountId`: `string` (the ID of the account in YNAB)
-   `lastSync`: `Date` (the timestamp of the last successful sync)

### Transaction

Represents a financial transaction that has been processed by the system.

-   `id`: `string` (unique transaction ID from Pluggy, used for idempotency)
-   `description`: `string`
-   `amount`: `number`
-   `date`: `Date`
-   `connectionId`: `string` (foreign key to Connection)
-   `status`: `string` (e.g., "pending", "imported", "failed")
