# ofx-playground

Export transactions from Pluggy accounts to Actual budget and OFX files.

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

```bash
npm run actual
```

### Export transactions from Pluggy accounts to OFX files

```bash
npm run export
```

### Deploy AWS lambda that exports transactions from Pluggy to Actual every day

```bash
cd packages/cron-aws-lambda
npx cdk bootstrap # bootstrap CDK if you haven't already
npx cdk deploy
```
