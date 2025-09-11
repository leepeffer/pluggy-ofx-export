import { logger, YnabClient, Client as PluggyClient, Synchronizer } from '@pluggy-ofx-export/core';

interface SyncOptions {
  account?: string | string[];
  from?: string;
}

export async function sync(options: SyncOptions) {
  if (!options.account) {
    logger.error('At least one --account mapping is required.');
    process.exit(1);
  }

  const ynabApiKey = process.env.YNAB_API_KEY;
  if (!ynabApiKey) {
    logger.error('YNAB_API_KEY environment variable is not set.');
    process.exit(1);
  }

  const pluggyClientId = process.env.PLUGGY_CLIENT_ID;
  const pluggyClientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!pluggyClientId || !pluggyClientSecret) {
    logger.error('PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET environment variables are not set.');
    process.exit(1);
  }

  const ynabClient = new YnabClient(ynabApiKey);
  const pluggyClient = new PluggyClient({ clientId: pluggyClientId, clientSecret: pluggyClientSecret });
  const synchronizer = new Synchronizer(pluggyClient, ynabClient);

  logger.info('Synchronization started.');

  const accounts = Array.isArray(options.account) ? options.account : [options.account];

  for (const account of accounts) {
    const [pluggyAccountId, ynabBudgetId, ynabAccountId] = account.split(':');
    if (!pluggyAccountId || !ynabBudgetId || !ynabAccountId) {
        logger.error(`Invalid account mapping: ${account}. Expected format: pluggy_account_id:ynab_budget_id:ynab_account_id`);
        continue;
    }

    const fromDate = options.from ? new Date(options.from) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    await synchronizer.sync(pluggyAccountId, ynabBudgetId, ynabAccountId, fromDate);
  }

  logger.info('Synchronization complete.');
}