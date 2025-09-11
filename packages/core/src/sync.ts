import { Client as PluggyClient, YnabClient, Transaction } from '.';
import { logger } from './logger';

export class Synchronizer {
  constructor(private pluggyClient: PluggyClient, private ynabClient: YnabClient) {}

  async sync(
    pluggyItemId: string,
    accountType: 'BANK' | 'CREDIT',
    ynabBudgetId: string,
    ynabAccountId: string,
    fromDate: Date
  ) {
    logger.info(
      `Starting sync for Pluggy item ${pluggyItemId} (${accountType}) to YNAB account ${ynabAccountId}`
    );

    // First, get all accounts from the Pluggy item
    const accounts = await this.pluggyClient.fetchAccounts(pluggyItemId);
    const targetAccount = accounts.results.find(account => account.type === accountType);
    
    if (!targetAccount) {
      logger.warn(`No ${accountType} account found in Pluggy item ${pluggyItemId}`);
      return;
    }

    logger.info(`Found ${accountType} account: ${targetAccount.name} (${targetAccount.id})`);

    const toDate = new Date();
    const pluggyTransactions = await this.pluggyClient.fetchTransactions(targetAccount.id, {
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
    });

    if (pluggyTransactions.results.length === 0) {
      logger.info('No new transactions to sync.');
      return;
    }

    const ynabTransactions = await this.ynabClient.getTransactions(ynabBudgetId, ynabAccountId, fromDate);
    const existingYnabImportIds = new Set(ynabTransactions.map(t => t.import_id));

    const newTransactions = pluggyTransactions.results.filter(
      t => !existingYnabImportIds.has(t.id)
    );

    if (newTransactions.length === 0) {
      logger.info('No new transactions to sync.');
      return;
    }

    const ynabPayload: Partial<Transaction>[] = newTransactions.map(t => ({
      id: t.id,
      amount: t.amount,
      description: t.description,
      date: t.date,
      connectionId: ynabAccountId,
    }));

    await this.ynabClient.createTransactions(ynabBudgetId, ynabAccountId, ynabPayload, accountType);

    logger.info(`Synced ${newTransactions.length} transactions.`);
  }
}