import { Client as PluggyClient, YnabClient, Transaction } from '.';
import { logger } from './logger';

export interface SyncedTransaction {
  date: string;
  description: string;
  amount: number;
  displayAmount: string;
  status: 'created' | 'duplicate';
}

export interface SyncResult {
  accountName: string;
  accountType: 'BANK' | 'CREDIT';
  dateRange: { from: string; to: string };
  transactionsFound: number;
  alreadyInYnab: number;  // Duplicates detected before sending to YNAB
  sentToYnab: number;     // Transactions we attempted to send
  actuallyCreated: number; // What YNAB actually created
  rejectedByYnab: number;  // What YNAB rejected as duplicates
  transactions: SyncedTransaction[];
  status: 'success' | 'skipped' | 'error';
  message?: string;
}

export class Synchronizer {
  constructor(private pluggyClient: PluggyClient, private ynabClient: YnabClient) {}

  async sync(
    pluggyItemId: string,
    accountType: 'BANK' | 'CREDIT',
    ynabBudgetId: string,
    ynabAccountId: string,
    fromDate: Date
  ): Promise<SyncResult> {
    const toDate = new Date();
    const dateRange = {
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
    };

    logger.info(
      `Starting sync for Pluggy item ${pluggyItemId} (${accountType}) to YNAB account ${ynabAccountId}`
    );

    // First, get all accounts from the Pluggy item
    const accounts = await this.pluggyClient.fetchAccounts(pluggyItemId);
    const targetAccount = accounts.results.find(account => account.type === accountType);
    
    if (!targetAccount) {
      logger.warn(`No ${accountType} account found in Pluggy item ${pluggyItemId}`);
      return {
        accountName: 'Unknown',
        accountType,
        dateRange,
        transactionsFound: 0,
        alreadyInYnab: 0,
        sentToYnab: 0,
        actuallyCreated: 0,
        rejectedByYnab: 0,
        transactions: [],
        status: 'skipped',
        message: `No ${accountType} account found in Pluggy item`,
      };
    }

    logger.info(`Found ${accountType} account: ${targetAccount.name} (${targetAccount.id})`);

    const pluggyTransactions = await this.pluggyClient.fetchTransactions(targetAccount.id, dateRange);

    if (pluggyTransactions.results.length === 0) {
      logger.info('No transactions found in date range.');
      return {
        accountName: targetAccount.name,
        accountType,
        dateRange,
        transactionsFound: 0,
        alreadyInYnab: 0,
        sentToYnab: 0,
        actuallyCreated: 0,
        rejectedByYnab: 0,
        transactions: [],
        status: 'success',
        message: 'No transactions found in date range',
      };
    }

    const ynabTransactions = await this.ynabClient.getTransactions(ynabBudgetId, ynabAccountId, fromDate);
    const existingYnabImportIds = new Set(ynabTransactions.map(t => t.import_id));

    const newTransactions = pluggyTransactions.results.filter(
      t => !existingYnabImportIds.has(t.id)
    );

    const alreadyInYnab = pluggyTransactions.results.length - newTransactions.length;

    if (newTransactions.length === 0) {
      logger.info('All transactions already exist in YNAB.');
      return {
        accountName: targetAccount.name,
        accountType,
        dateRange,
        transactionsFound: pluggyTransactions.results.length,
        alreadyInYnab,
        sentToYnab: 0,
        actuallyCreated: 0,
        rejectedByYnab: 0,
        transactions: [],
        status: 'success',
        message: 'All transactions already in YNAB',
      };
    }

    const ynabPayload: Partial<Transaction>[] = newTransactions.map(t => ({
      id: t.id,
      amount: t.amount,
      description: t.description,
      date: t.date,
      connectionId: ynabAccountId,
    }));

    // Send to YNAB and get actual results
    const ynabResponse = await this.ynabClient.createTransactions(ynabBudgetId, ynabAccountId, ynabPayload, accountType);
    const duplicateIdsFromYnab = new Set(ynabResponse.duplicateImportIds);

    logger.info(`Sent ${newTransactions.length} to YNAB. Created: ${ynabResponse.transactionsCreated}, Rejected as duplicates: ${ynabResponse.duplicateImportIds.length}`);

    return {
      accountName: targetAccount.name,
      accountType,
      dateRange,
      transactionsFound: pluggyTransactions.results.length,
      alreadyInYnab,
      sentToYnab: newTransactions.length,
      actuallyCreated: ynabResponse.transactionsCreated,
      rejectedByYnab: ynabResponse.duplicateImportIds.length,
      transactions: newTransactions.map(t => {
        // For CREDIT accounts, invert the sign (same logic as ynab-client.ts)
        const displayAmount = accountType === 'CREDIT' ? -t.amount : t.amount;
        const wasRejected = duplicateIdsFromYnab.has(t.id);
        return {
          date: typeof t.date === 'string' ? t.date.split('T')[0] : t.date,
          description: t.description,
          amount: t.amount,
          displayAmount: displayAmount.toFixed(2),
          status: wasRejected ? 'duplicate' as const : 'created' as const,
        };
      }),
      status: 'success',
    };
  }
}
