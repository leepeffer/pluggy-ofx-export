import { logger, YnabClient, Client as PluggyClient, Synchronizer } from '@pluggy-ofx-export/core';

interface AccountConfig {
  name: string;
  pluggy_id: string;
  ynab_budget_id: string;
  ynab_account_id: string;
  type: 'BANK' | 'CREDIT';
}

export async function sync() {
  const {
    ACCOUNT_CONFIG,
    YNAB_API_KEY,
    PLUGGY_CLIENT_ID,
    PLUGGY_CLIENT_SECRET,
  } = process.env;

  if (!ACCOUNT_CONFIG || !YNAB_API_KEY || !PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) {
    logger.error('All required environment variables must be set: ACCOUNT_CONFIG, YNAB_API_KEY, PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET');
    process.exit(1);
  }

  const accountConfigs: AccountConfig[] = JSON.parse(ACCOUNT_CONFIG);

  const ynabClient = new YnabClient(YNAB_API_KEY);
  const pluggyClient = new PluggyClient({ clientId: PLUGGY_CLIENT_ID, clientSecret: PLUGGY_CLIENT_SECRET });
  const synchronizer = new Synchronizer(pluggyClient, ynabClient);

  logger.info('Synchronization started.');

  for (const config of accountConfigs) {
    const { name, pluggy_id, ynab_budget_id, ynab_account_id, type } = config;
    logger.info(`Syncing account: ${name} (${type})`);
    const fromDate = new Date(new Date().setMonth(new Date().getMonth() - 1)); // default to last month
    await synchronizer.sync(pluggy_id, type, ynab_budget_id, ynab_account_id, fromDate);
  }

  logger.info('Synchronization complete.');
}