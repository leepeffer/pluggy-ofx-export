import { Client as PluggyClient, YnabClient, Transaction } from '.';
import { logger } from './logger';

/** Suffix we use for re-import when YNAB rejects duplicate (e.g. transaction was deleted in YNAB). */
export const REIMPORT_IMPORT_ID_SUFFIX = '-reimport';

/**
 * Transaction-level status after sync.
 *
 * Duplicate handling:
 * 1. **Our pre-check (skipped_exists)**: We GET existing YNAB transactions, build the set of
 *    Pluggy ids we already have (import_id and import_id without "-reimport" suffix), and skip
 *    sending those.
 * 2. **YNAB reject (rejected_duplicate)**: We send; YNAB returns duplicate_import_ids when the
 *    import_id was already used (e.g. by a deleted transaction). We retry those with
 *    import_id = id + "-reimport" so they can be re-imported; success is marked created_reimport.
 */
export type TransactionStatus =
  | 'skipped_exists'      // We detected it already exists in YNAB
  | 'created'             // Sent to YNAB and successfully created
  | 'created_reimport'    // Rejected as duplicate (e.g. deleted in YNAB), retried with -reimport and created
  | 'rejected_duplicate'; // Sent to YNAB but rejected and retry did not create (should be rare)

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
  rejectedByYnab: number;   // What YNAB rejected and we could not re-import
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

    // Our duplicate pre-check: GET existing YNAB transactions. Consider a Pluggy transaction
    // "already in YNAB" if we have import_id = t.id or import_id = t.id + REIMPORT_IMPORT_ID_SUFFIX.
    const ynabTransactions = await this.ynabClient.getTransactions(ynabBudgetId, ynabAccountId, fromDate);
    const existingPluggyIdsWeHave = new Set<string>();
    for (const imp of ynabTransactions.map(t => t.import_id).filter(Boolean) as string[]) {
      existingPluggyIdsWeHave.add(imp);
      if (imp.endsWith(REIMPORT_IMPORT_ID_SUFFIX)) {
        existingPluggyIdsWeHave.add(imp.slice(0, -REIMPORT_IMPORT_ID_SUFFIX.length));
      }
    }

    const skippedTransactions: SyncedTransaction[] = [];
    const transactionsToSend: any[] = [];

    for (const t of pluggyTransactions.results) {
      if (existingPluggyIdsWeHave.has(t.id)) {
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

    // Send to YNAB (first attempt uses Pluggy id as import_id)
    const ynabPayload: (Partial<Transaction> & { importId?: string })[] = transactionsToSend.map(t => ({
      id: t.id,
      amount: t.amount,
      description: t.description,
      date: t.date,
      connectionId: ynabAccountId,
    }));

    let ynabResponse = await this.ynabClient.createTransactions(ynabBudgetId, ynabAccountId, ynabPayload, accountType);
    const duplicateIdsFromYnab = new Set(ynabResponse.duplicateImportIds);

    logger.info(`Sent ${transactionsToSend.length} to YNAB. Created: ${ynabResponse.transactionsCreated}, Rejected as duplicates: ${ynabResponse.duplicateImportIds.length}`);

    // Re-import rejected transactions (e.g. deleted in YNAB) using a distinct import_id so YNAB accepts them
    let retryDuplicateIds = new Set<string>();
    if (duplicateIdsFromYnab.size > 0) {
      const retryPayload = transactionsToSend
        .filter(t => duplicateIdsFromYnab.has(t.id))
        .map(t => ({
          id: t.id,
          amount: t.amount,
          description: t.description,
          date: t.date,
          connectionId: ynabAccountId,
          importId: t.id + REIMPORT_IMPORT_ID_SUFFIX,
        }));
      try {
        const retryResponse = await this.ynabClient.createTransactions(ynabBudgetId, ynabAccountId, retryPayload, accountType);
        retryDuplicateIds = new Set(retryResponse.duplicateImportIds);
        ynabResponse = {
          transactionsCreated: ynabResponse.transactionsCreated + retryResponse.transactionsCreated,
          duplicateImportIds: Array.from(retryDuplicateIds),
        };
        logger.info(`Re-imported ${retryPayload.length} rejected txns with -reimport. Created: ${retryResponse.transactionsCreated}, Still rejected: ${retryResponse.duplicateImportIds.length}`);
      } catch (err) {
        // YNAB may return 400 for the retry batch (e.g. validation); treat all retried as still rejected so we still return a result and the summary is emitted
        logger.warn(`Re-import retry failed: ${err instanceof Error ? err.message : String(err)}. Treating ${retryPayload.length} transactions as rejected_duplicate.`);
        retryPayload.forEach(t => retryDuplicateIds.add(t.id + REIMPORT_IMPORT_ID_SUFFIX));
      }
    }

    // Format sent transactions: created, created_reimport (rejected then re-imported), or rejected_duplicate
    const sentTransactions: SyncedTransaction[] = transactionsToSend.map(t => {
      const wasRejected = duplicateIdsFromYnab.has(t.id);
      if (!wasRejected) return formatTransaction(t, 'created');
      const reimportId = t.id + REIMPORT_IMPORT_ID_SUFFIX;
      const stillRejected = retryDuplicateIds.has(reimportId);
      return formatTransaction(t, stillRejected ? 'rejected_duplicate' : 'created_reimport');
    });

    const allTransactions = [...skippedTransactions, ...sentTransactions];
    allTransactions.sort((a, b) => {
      const dateA = String(a.date);
      const dateB = String(b.date);
      return dateB.localeCompare(dateA);
    });

    const rejectedCount = sentTransactions.filter(tx => tx.status === 'rejected_duplicate').length;

    return {
      accountName: targetAccount.name,
      accountType,
      dateRange,
      transactionsFound: pluggyTransactions.results.length,
      skippedExists: skippedTransactions.length,
      sentToYnab: transactionsToSend.length,
      actuallyCreated: ynabResponse.transactionsCreated,
      rejectedByYnab: rejectedCount,
      transactions: allTransactions,
      status: 'success',
    };
  }
}
