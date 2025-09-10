# Pluggy OFX Exporter

> **⚠️ Warning**: This was entirely vibe coded by someone untrained in computer science. Be warned.

This project allows you to export transactions from financial institutions in Brazil to OFX files.
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

2. Edit `.env` with your actual Pluggy API credentials:
```bash
PLUGGY_CLIENT_ID=your_actual_client_id
PLUGGY_CLIENT_SECRET=your_actual_client_secret
PLUGGY_ITEM_IDS=item_id_1,item_id_2,item_id_3
```

> **⚠️ Security Warning**: Never commit your `.env` file to version control. It contains sensitive API credentials that should remain private.

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
