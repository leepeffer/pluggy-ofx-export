import { Client as PluggyClient, YnabClient, Transaction } from '.';
import { logger } from './logger';

export class Synchronizer {
  constructor(private pluggyClient: PluggyClient, private ynabClient: YnabClient) {}

  async sync(
    pluggyAccountId: string,
    ynabBudgetId: string,
    ynabAccountId: string,
    fromDate: Date
  ) {
    logger.info(
      `Starting sync for Pluggy account ${pluggyAccountId} to YNAB account ${ynabAccountId}`
    );

    const toDate = new Date();
    const pluggyTransactions = await this.pluggyClient.fetchTransactions(pluggyAccountId, {
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

    await this.ynabClient.createTransactions(ynabBudgetId, ynabPayload);

    logger.info(`Synced ${newTransactions.length} transactions.`);
  }
}