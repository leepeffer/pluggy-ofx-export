# Pluggy OFX Exporter & YNAB Sync

> **⚠️ Warning**: This was entirely vibe coded by someone untrained in computer science. Be warned.

This project allows you to export transactions from financial institutions in Brazil to OFX files, and also to synchronize them with YNAB.
It uses the free open finance API from [Pluggy](https://www.pluggy.ai/en).

## Setup

### Pre-requisites

Run:

```bash
pnpm install
```

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your actual Pluggy API credentials and YNAB API Key:
```bash
PLUGGY_CLIENT_ID=your_actual_client_id
PLUGGY_CLIENT_SECRET=your_actual_client_secret
PLUGGY_ITEM_IDS=item_id_1,item_id_2,item_id_3
YNAB_API_KEY=your_ynab_api_key
```

> **⚠️ Security Warning**: Never commit your `.env` file to version control. It contains sensitive API credentials that should remain private.

## Usage

### Export transactions from Pluggy accounts to OFX files

**Option 1: Web Interface (Recommended)**
```bash
pnpm run web
```
Then open http://localhost:3001 in your browser for a user-friendly interface.

**Option 2: Command Line**
```bash
pnpm run export-ofx
```

The web interface provides:
- 🎨 Modern, intuitive interface
- 📅 Custom date range selection
- 🏦 Selective account export
- 📝 Custom file naming
- 📁 Choose export location
- 💾 Download as ZIP or individual files

The command line exports the last 3 months of transactions from each account in Pluggy to different OFX files in the `exports/` directory, organized by date.

### Synchronize transactions with YNAB

You can also synchronize your transactions directly with YNAB.

**1. Configure Credentials**

First, you need to configure your credentials using the CLI:
```bash
npx tsx ./packages/export-ofx/bin/index.ts configure --pluggy-client-id YOUR_PLUGGY_CLIENT_ID --pluggy-client-secret YOUR_PLUGGY_CLIENT_SECRET --ynab-api-key YOUR_YNAB_API_KEY
```
This will save your credentials to a `.env` file in the root of the project.

**2. Find Account IDs**

You will need the account IDs from both Pluggy.ai and YNAB that you want to connect.

-   **Pluggy.ai**: You can get the account ID from the Pluggy.ai dashboard or API.
-   **YNAB**: You can get the budget and account IDs from the YNAB dashboard or API.

**3. Synchronize Transactions**

Once configured, you can run the synchronization command. You need to map the Pluggy.ai account ID to the YNAB budget and account ID.

```bash
npx tsx ./packages/export-ofx/bin/index.ts sync --account <pluggy_account_id>:<ynab_budget_id>:<ynab_account_id>
```

You can map multiple accounts by providing the `--account` argument multiple times.

```bash
npx tsx ./packages/export-ofx/bin/index.ts sync \
  --account <pluggy_account_id_1>:<ynab_budget_id_1>:<ynab_account_id_1> \
  --account <pluggy_account_id_2>:<ynab_budget_id_2>:<ynab_account_id_2>
```

The tool will fetch new transactions from Pluggy.ai and export them to your YNAB account.

## Features

- **Web Interface**: Modern, user-friendly interface for easy OFX export
- **Command Line Tool**: Traditional CLI for automated exports
- **OFX Export**: Export transactions to standard OFX format for use with financial software
- **Brazilian Bank Support**: Optimized for Brazilian financial institutions via Pluggy API
- **Multiple Account Types**: Support for both bank accounts and credit cards
- **Transaction Filtering**: Built-in filters for common Brazilian bank transaction patterns
- **Organized Output**: Files are automatically organized by date in the `exports/` directory
- **Custom Configuration**: Flexible date ranges, account selection, and file naming

## What's Different from the Original

This fork removes all ACTUAL budget integration functionality and focuses exclusively on OFX file generation:

- ❌ Removed ACTUAL budget integration (`packages/export-actual/`)
- ❌ Removed AWS Lambda cron job (`packages/cron-aws-lambda/`)
- ❌ Removed ACTUAL-related environment variables
- ✅ Kept core OFX generation functionality
- ✅ Kept transaction filtering for Brazilian banks
- ✅ Kept support for both bank accounts and credit cards

## Credits

Original repository by [@felipeagc](https://github.com/felipeagc) - [pluggy-actual-export](https://github.com/felipeagc/pluggy-actual-export)

Thank you to Felipe for creating the original implementation and making it available as open source!

## Security

This repository is designed to be safe for public use. Here are the security measures in place:

- **Environment Variables**: All sensitive data (API keys, secrets) are loaded from environment variables
- **Gitignore Protection**: The `.gitignore` file excludes all sensitive files (`.env`, `*.ofx`, etc.)
- **No Hardcoded Secrets**: No API credentials are hardcoded in the source code
- **Example Configuration**: Use `.env.example` as a template for your local configuration

### Before Making Public

If you're planning to make this repository public, ensure:

1. ✅ No `.env` files are committed
2. ✅ No API keys or secrets in the code
3. ✅ `.gitignore` properly excludes sensitive files
4. ✅ Use `.env.example` for configuration template
5. ✅ Review git history for any accidentally committed secrets

### Getting Pluggy API Credentials

1. Visit [Pluggy Dashboard](https://dashboard.pluggy.ai/)
2. Create an account or sign in
3. Navigate to the API section
4. Generate your Client ID and Client Secret
5. Connect your financial institutions to get Item IDs

**📚 Helpful Tutorial**: For a detailed step-by-step guide on setting up Pluggy credentials, check out the [Actual Budget Pluggy.ai Setup Guide](https://actualbudget.org/docs/experimental/pluggyai) - it provides excellent instructions for the entire process!