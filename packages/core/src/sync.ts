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
    
    // Helper function to normalize Pluggy amount to YNAB milliunits
    const normalizeAmount = (amount: number, isCredit: boolean): number => {
      let normalized = Math.round(amount * 1000);
      if (isCredit) {
        normalized = -normalized;
      }
      return normalized;
    };
    
    // Helper function to normalize Pluggy date to ISO format (YYYY-MM-DD)
    const normalizeDate = (date: Date | string): string => {
      return new Date(date).toISOString().split('T')[0];
    };
    
    // Build lookup structures from existing YNAB transactions
    // 1. Set of existing import_ids (filter out null/undefined)
    const existingYnabImportIds = new Set(
      ynabTransactions.map(t => t.import_id).filter(id => id)
    );
    
    // 2. Set of date+amount combinations for secondary duplicate check
    const existingYnabDateAmounts = new Set(
      ynabTransactions.map(t => `${t.date}:${t.amount}`)
    );
    
    // Filter transactions using two-tier duplicate detection
    const newTransactions = pluggyTransactions.results.filter(pluggyTx => {
      // Primary check: If import_id matches, skip (duplicate)
      if (existingYnabImportIds.has(pluggyTx.id)) {
        logger.debug(`Skipping duplicate by import_id: ${pluggyTx.id}`);
        return false;
      }
      
      // Secondary check: If date + amount match, skip (duplicate)
      const normalizedAmount = normalizeAmount(pluggyTx.amount, accountType === 'CREDIT');
      const normalizedDate = normalizeDate(pluggyTx.date);
      const dateAmountKey = `${normalizedDate}:${normalizedAmount}`;
      
      if (existingYnabDateAmounts.has(dateAmountKey)) {
        logger.debug(`Skipping duplicate by date+amount: ${pluggyTx.id} (${dateAmountKey})`);
        return false;
      }
      
      // Not a duplicate - include this transaction
      return true;
    });

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