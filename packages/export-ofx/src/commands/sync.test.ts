import { describe, it, expect, vi } from 'vitest';
import { sync } from './sync';
import { Synchronizer } from '@pluggy-ofx-export/core';

const synchronizerSyncSpy = vi.fn().mockResolvedValue(undefined);
vi.mock('@pluggy-ofx-export/core', async () => {
    const actual = await vi.importActual('@pluggy-ofx-export/core');
    return {
        ...actual,
        Synchronizer: vi.fn().mockImplementation(() => ({
            sync: synchronizerSyncSpy,
        })),
    };
});

describe('sync command', () => {
  it('should call the Synchronizer with the correct parameters from ACCOUNT_CONFIG', async () => {
    process.env.YNAB_API_KEY = 'FAKE_YNAB_KEY';
    process.env.PLUGGY_CLIENT_ID = 'FAKE_PLUGGY_ID';
    process.env.PLUGGY_CLIENT_SECRET = 'FAKE_PLUGGY_SECRET';
    process.env.ACCOUNT_CONFIG = JSON.stringify([
      {
        name: 'My Checking Account',
        pluggy_id: 'pluggy_id_1',
        ynab_budget_id: 'ynab_budget_id_1',
        ynab_account_id: 'ynab_account_id_1',
        type: 'BANK',
      },
    ]);

    await sync();

    expect(Synchronizer).toHaveBeenCalled();
    expect(synchronizerSyncSpy).toHaveBeenCalledWith(
      'pluggy_id_1',
      'BANK',
      'ynab_budget_id_1',
      'ynab_account_id_1',
      expect.any(Date)
    );
  });
});