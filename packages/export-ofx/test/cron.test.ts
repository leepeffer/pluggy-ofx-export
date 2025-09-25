import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { sync } from '../src/commands/sync';
import { YnabClient, Client, Synchronizer } from '@pluggy-ofx-export/core';

const synchronizerSyncSpy = vi.fn().mockResolvedValue(undefined);

vi.mock('@pluggy-ofx-export/core', async () => {
    const actual = await vi.importActual('@pluggy-ofx-export/core');
    return {
        ...actual,
        YnabClient: vi.fn(),
        Client: vi.fn(),
        Synchronizer: vi.fn().mockImplementation(() => ({
            sync: synchronizerSyncSpy,
        })),
    };
});


describe('Cron Job Execution', () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env = {
      ...OLD_ENV,
      ACCOUNT_CONFIG: JSON.stringify([
        {
          name: 'Test Account',
          pluggy_id: 'test-pluggy-id',
          ynab_budget_id: 'test-ynab-budget-id',
          ynab_account_id: 'test-ynab-account-id',
          type: 'BANK',
        },
      ]),
      YNAB_API_KEY: 'test-ynab-token',
      PLUGGY_CLIENT_ID: 'test-pluggy-id',
      PLUGGY_CLIENT_SECRET: 'test-pluggy-secret',
    };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should run sync successfully with environment variables', async () => {
    await sync();
    expect(synchronizerSyncSpy).toHaveBeenCalled();
    expect(YnabClient).toHaveBeenCalledWith('test-ynab-token');
    expect(Client).toHaveBeenCalledWith({
      clientId: 'test-pluggy-id',
      clientSecret: 'test-pluggy-secret',
    });
  });
});