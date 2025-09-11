export interface User {
  id: string;
  pluggyApiKey: string;
  ynabApiKey: string;
}

export interface Connection {
  id: string;
  userId: string;
  pluggyAccountId: string;
  ynabAccountId: string;
  lastSync: Date;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  connectionId: string;
  status: 'pending' | 'imported' | 'failed';
}
