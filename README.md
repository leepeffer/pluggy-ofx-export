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

2. Edit `.env` with your actual Pluggy API credentials, YNAB API Key, and account configurations:
```bash
PLUGGY_CLIENT_ID=your_actual_client_id
PLUGGY_CLIENT_SECRET=your_actual_client_secret
YNAB_API_KEY=your_ynab_api_key

ACCOUNT_CONFIG='[
  {
    "name": "My Checking Account",
    "pluggy_id": "pluggy_account_id_1",
    "ynab_budget_id": "ynab_budget_id_1",
    "ynab_account_id": "ynab_account_id_1"
  },
  {
    "name": "My Credit Card",
    "pluggy_id": "pluggy_account_id_2",
    "ynab_budget_id": "ynab_budget_id_2",
    "ynab_account_id": "ynab_account_id_2"
  }
]'
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

### Synchronize transactions with YNAB

Once you have configured your `.env` file with your account configurations, you can run the synchronization command:

```bash
npx tsx ./packages/export-ofx/bin/index.ts sync
```

The tool will fetch new transactions from Pluggy.ai and export them to your YNAB account based on the configurations you provided.

### Deployment to Render.com

This project can be deployed as a cron job on Render.com to run the synchronization automatically.

1.  **Fork this repository** to your GitHub account.
2.  **Create a new "Cron Job"** service on the [Render Dashboard](https://dashboard.render.com/).
3.  **Connect your forked repository**.
4.  Render will automatically detect the `render.yaml` file and configure the cron job.
5.  **Add your environment variables** in the "Environment" tab of your new service. You will need to set the following:
    -   `MOCK_ACCOUNT_CONFIG`
    -   `YNAB_ACCESS_TOKEN`
    -   `PLUGGY_CLIENT_ID`
    -   `PLUGGY_CLIENT_SECRET`
6.  The cron job will now run on the schedule defined in `render.yaml` (daily at midnight UTC by default).

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