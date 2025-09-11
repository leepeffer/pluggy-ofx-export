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
  it('should call the Synchronizer with the correct parameters', async () => {
    process.env.YNAB_API_KEY = 'FAKE_YNAB_KEY';
    process.env.PLUGGY_CLIENT_ID = 'FAKE_PLUGGY_ID';
    process.env.PLUGGY_CLIENT_SECRET = 'FAKE_PLUGGY_SECRET';

    await sync({ account: 'PLUGGY_ID:BUDGET_ID:YNAB_ID' });

    expect(Synchronizer).toHaveBeenCalled();
    expect(synchronizerSyncSpy).toHaveBeenCalledWith(
      'PLUGGY_ID',
      'BUDGET_ID',
      'YNAB_ID',
      expect.any(Date)
    );
  });
});