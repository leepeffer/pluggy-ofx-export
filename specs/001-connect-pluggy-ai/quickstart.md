# Quickstart: Connect Pluggy.ai with YNAB API

This guide provides a quick overview of how to use the Pluggy.ai to YNAB export feature.

## 1. Configuration

First, you need to configure your API keys for both Pluggy.ai and YNAB.

```bash
npx tsx ./packages/export-ofx/bin/index.ts configure --pluggy-api-key YOUR_PLUGGY_KEY --ynab-api-key YOUR_YNAB_KEY
```

This will securely store your credentials for future use.

## 2. Find Account IDs

You will need the account IDs from both Pluggy.ai and YNAB that you want to connect.

-   **Pluggy.ai**: You can get the account ID from the Pluggy.ai dashboard or API.
-   **YNAB**: You can get the budget and account IDs from the YNAB dashboard or API.

## 3. Synchronize Transactions

Once configured, you can run the synchronization command. You need to map the Pluggy.ai account ID to the YNAB account ID.

```bash
npx tsx ./packages/export-ofx/bin/index.ts sync --account <pluggy_account_id>:<ynab_account_id>
```

You can map multiple accounts by providing the `--account` argument multiple times.

```bash
npx tsx ./packages/export-ofx/bin/index.ts sync \
  --account <pluggy_account_id_1>:<ynab_account_id_1> \
  --account <pluggy_account_id_2>:<ynab_account_id_2>
```

The tool will fetch new transactions from Pluggy.ai and export them to your YNAB account.

```