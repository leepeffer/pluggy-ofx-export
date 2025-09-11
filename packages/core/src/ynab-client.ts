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

  async createTransactions(budgetId: string, accountId: string, transactions: Partial<Transaction>[], accountType: 'BANK' | 'CREDIT') {
    const ynabTransactions = transactions.map(t => {
      let amount = t.amount ? Math.round(t.amount * 1000) : 0;
      
      // For CREDIT accounts, invert the amount so expenses show as outflows
      if (accountType === 'CREDIT') {
        amount = -amount;
      }
      
      return {
        // YNAB API requires amount in milliunits (integer)
        amount: amount,
        date: t.date?.toISOString().split('T')[0],
        // Move description to payee field instead of memo
        payee_name: t.description,
        // import_id is used for duplicate detection
        import_id: t.id,
        // YNAB API requires account field
        account_id: accountId,
      };
    });

    return this.client.post(`/budgets/${budgetId}/transactions`, {
      transactions: ynabTransactions,
    });
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