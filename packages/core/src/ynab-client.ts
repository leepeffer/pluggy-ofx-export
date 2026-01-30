import axios, { AxiosInstance } from 'axios';
import { Transaction } from './models';

const YNAB_API_URL = 'https://api.youneedabudget.com/v1';

export interface YnabBudget {
  id: string;
  name: string;
}

export interface YnabAccount {
  id: string;
  name: string;
}

export interface CreateTransactionsResponse {
  transactionsCreated: number;
  duplicateImportIds: string[];
}

export class YnabClient {
  private client: AxiosInstance;

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: YNAB_API_URL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async getBudgets(): Promise<YnabBudget[]> {
    const response = await this.client.get('/budgets');
    return response.data.data.budgets;
  }

  async getAccounts(budgetId: string): Promise<YnabAccount[]> {
    const response = await this.client.get(`/budgets/${budgetId}/accounts`);
    return response.data.data.accounts;
  }

  /** Payload can include optional importId (e.g. for re-import after YNAB reject). */
  async createTransactions(
    budgetId: string,
    accountId: string,
    transactions: (Partial<Transaction> & { importId?: string })[],
    accountType: 'BANK' | 'CREDIT'
  ): Promise<CreateTransactionsResponse> {
    const ynabTransactions = transactions.map(t => {
      let amount = t.amount ? Math.round(t.amount * 1000) : 0;

      if (accountType === 'CREDIT') {
        amount = -amount;
      }

      const importId = t.importId ?? t.id;
      return {
        amount,
        date: t.date?.toISOString().split('T')[0],
        payee_name: t.description,
        import_id: importId,
        account_id: accountId,
      };
    });

    const response = await this.client.post(`/budgets/${budgetId}/transactions`, {
      transactions: ynabTransactions,
    });

    return {
      transactionsCreated: response.data.data.transactions?.length || 0,
      duplicateImportIds: response.data.data.duplicate_import_ids || [],
    };
  }

  async getTransactions(budgetId: string, accountId: string, sinceDate?: Date): Promise<any[]> {
    const params: any = {};
    if (sinceDate) {
      params.since_date = sinceDate.toISOString().split('T')[0];
    }
    const response = await this.client.get(`/budgets/${budgetId}/accounts/${accountId}/transactions`, { params });
    return response.data.data.transactions;
  }
}