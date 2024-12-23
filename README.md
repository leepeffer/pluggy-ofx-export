# Pluggy OFX and Actual Budget exporter

This project allows you to export transactions from financial institutions in Brazil to [Actual budget](https://actualbudget.org/) and OFX files.
It uses the free open finance API from [Pluggy](https://www.pluggy.ai/en).

## Setup

### Pre-requisites

Run:

```bash
npm install
```

Create a .env file with the following content:

```bash
PLUGGY_CLIENT_ID=...       # Pluggy client ID
PLUGGY_CLIENT_SECRET=...   # Pluggy client secret
PLUGGY_ITEM_IDS=...        # comma separated item IDs from Pluggy
ACTUAL_BUDGET_URL=...      # Actual server URL
ACTUAL_BUDGET_PASSWORD=... # Actual server password
ACTUAL_BUDGET_SYNC_ID=...  # Actual budget sync ID (found in advanced settings)
```

### Export transactions from Pluggy accounts to Actual budget

Run the command:
```bash
npm run export-actual
```

The script will try to guess which Actual accounts correspond to your bank/credit card accounts from Pluggy based on a heuristic.
To make sure this works well, include the following in your Actual account names:
- Full name of the financial institution
- Number of the financial institution
- Last 4 digits of the credit card
- The words `checking` or `credit card`
- Brand and level of the credit card

### Export transactions from Pluggy accounts to OFX files

Run the command:
```bash
npm run export-ofx
```

This will export the last 3 months of transactions from each account in Pluggy to different OFX files in the current directory.

### Deploy AWS lambda that exports transactions from Pluggy to Actual every day

```bash
cd packages/cron-aws-lambda
npx cdk bootstrap # bootstrap AWS CDK if you haven't already
npx cdk deploy
```

This will create a schedule that runs an AWS lambda every day at 00:00 that exports your transactions to Actual budget.

Note: you need to have configured the AWS CLI first.
