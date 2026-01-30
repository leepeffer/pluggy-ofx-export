import { Client as PluggyClient, YnabClient, Transaction } from '.';
import { logger } from './logger';

export type TransactionStatus = 
  | 'skipped_exists'      // We detected it already exists in YNAB (import_id match)
  | 'created'             // Sent to YNAB and successfully created
  | 'rejected_duplicate'; // Sent to YNAB but rejected (import_id already used, even if deleted)

export interface SyncedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  displayAmount: string;
  status: TransactionStatus;
}

export interface SyncResult {
  accountName: string;
  accountType: 'BANK' | 'CREDIT';
  dateRange: { from: string; to: string };
  transactionsFound: number;
  skippedExists: number;    // We detected these already exist in YNAB
  sentToYnab: number;       // Transactions we attempted to send
  actuallyCreated: number;  // What YNAB actually created
  rejectedByYnab: number;   // What YNAB rejected as duplicates
  transactions: SyncedTransaction[];  // ALL transactions with their status
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
        skippedExists: 0,
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
        skippedExists: 0,
        sentToYnab: 0,
        actuallyCreated: 0,
        rejectedByYnab: 0,
        transactions: [],
        status: 'success',
        message: 'No transactions found in date range',
      };
    }

    // Helper to format a transaction for the report
    const formatTransaction = (t: any, status: TransactionStatus): SyncedTransaction => {
      const displayAmount = accountType === 'CREDIT' ? -t.amount : t.amount;
      return {
        id: t.id,
        date: typeof t.date === 'string' ? t.date.split('T')[0] : t.date,
        description: t.description,
        amount: t.amount,
        displayAmount: displayAmount.toFixed(2),
        status,
      };
    };

    // Get existing YNAB transactions to check for duplicates
    const ynabTransactions = await this.ynabClient.getTransactions(ynabBudgetId, ynabAccountId, fromDate);
    const existingYnabImportIds = new Set(ynabTransactions.map(t => t.import_id));

    // Separate transactions into those we'll skip and those we'll send
    const skippedTransactions: SyncedTransaction[] = [];
    const transactionsToSend: any[] = [];

    for (const t of pluggyTransactions.results) {
      if (existingYnabImportIds.has(t.id)) {
        skippedTransactions.push(formatTransaction(t, 'skipped_exists'));
      } else {
        transactionsToSend.push(t);
      }
    }

    logger.info(`Found ${pluggyTransactions.results.length} transactions. Skipping ${skippedTransactions.length} (already in YNAB). Sending ${transactionsToSend.length} to YNAB.`);

    // If nothing to send, return with skipped transactions
    if (transactionsToSend.length === 0) {
      logger.info('All transactions already exist in YNAB.');
      return {
        accountName: targetAccount.name,
        accountType,
        dateRange,
        transactionsFound: pluggyTransactions.results.length,
        skippedExists: skippedTransactions.length,
        sentToYnab: 0,
        actuallyCreated: 0,
        rejectedByYnab: 0,
        transactions: skippedTransactions,
        status: 'success',
        message: 'All transactions already in YNAB',
      };
    }

    // Send to YNAB
    const ynabPayload: Partial<Transaction>[] = transactionsToSend.map(t => ({
      id: t.id,
      amount: t.amount,
      description: t.description,
      date: t.date,
      connectionId: ynabAccountId,
    }));

    const ynabResponse = await this.ynabClient.createTransactions(ynabBudgetId, ynabAccountId, ynabPayload, accountType);
    const duplicateIdsFromYnab = new Set(ynabResponse.duplicateImportIds);

    logger.info(`Sent ${transactionsToSend.length} to YNAB. Created: ${ynabResponse.transactionsCreated}, Rejected as duplicates: ${ynabResponse.duplicateImportIds.length}`);

    // Format sent transactions with their actual status from YNAB
    const sentTransactions: SyncedTransaction[] = transactionsToSend.map(t => {
      const wasRejected = duplicateIdsFromYnab.has(t.id);
      return formatTransaction(t, wasRejected ? 'rejected_duplicate' : 'created');
    });

    // Combine all transactions for the report
    const allTransactions = [...skippedTransactions, ...sentTransactions];
    // Sort by date descending (ensure dates are strings)
    allTransactions.sort((a, b) => {
      const dateA = String(a.date);
      const dateB = String(b.date);
      return dateB.localeCompare(dateA);
    });

    return {
      accountName: targetAccount.name,
      accountType,
      dateRange,
      transactionsFound: pluggyTransactions.results.length,
      skippedExists: skippedTransactions.length,
      sentToYnab: transactionsToSend.length,
      actuallyCreated: ynabResponse.transactionsCreated,
      rejectedByYnab: ynabResponse.duplicateImportIds.length,
      transactions: allTransactions,
      status: 'success',
    };
  }
}
