import { logger, YnabClient, Client as PluggyClient, Synchronizer, SyncResult } from '@pluggy-ofx-export/core';

interface AccountConfig {
  name: string;
  pluggy_id: string;
  ynab_budget_id: string;
  ynab_account_id: string;
  type: 'BANK' | 'CREDIT';
}

interface SyncSummary {
  timestamp: string;
  dateRange: { from: string; to: string };
  totalAccounts: number;
  totalTransactionsFound: number;
  totalSkippedExists: number;    // We detected these already exist in YNAB
  totalSentToYnab: number;       // What we attempted to send
  totalActuallyCreated: number;  // What YNAB actually created
  totalRejectedByYnab: number;   // What YNAB rejected as duplicates
  results: (SyncResult & { configName: string })[];
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

  const results: (SyncResult & { configName: string })[] = [];

  const fromDate = new Date(new Date().setMonth(new Date().getMonth() - 1)); // default to last month
  const toDate = new Date();
  const dateRange = {
    from: fromDate.toISOString().split('T')[0],
    to: toDate.toISOString().split('T')[0],
  };

  for (const config of accountConfigs) {
    const { name, pluggy_id, ynab_budget_id, ynab_account_id, type } = config;
    logger.info(`Syncing account: ${name} (${type})`);
    const result = await synchronizer.sync(pluggy_id, type, ynab_budget_id, ynab_account_id, fromDate);
    results.push({ ...result, configName: name });
  }

  logger.info('Synchronization complete.');

  // Output summary as JSON for GitHub Actions
  const summary: SyncSummary = {
    timestamp: new Date().toISOString(),
    dateRange,
    totalAccounts: results.length,
    totalTransactionsFound: results.reduce((sum, r) => sum + r.transactionsFound, 0),
    totalSkippedExists: results.reduce((sum, r) => sum + r.skippedExists, 0),
    totalSentToYnab: results.reduce((sum, r) => sum + r.sentToYnab, 0),
    totalActuallyCreated: results.reduce((sum, r) => sum + r.actuallyCreated, 0),
    totalRejectedByYnab: results.reduce((sum, r) => sum + r.rejectedByYnab, 0),
    results,
  };

  // Output the summary marker and JSON for the workflow to parse
  console.log('::SYNC_SUMMARY_START::');
  console.log(JSON.stringify(summary, null, 2));
  console.log('::SYNC_SUMMARY_END::');
}
