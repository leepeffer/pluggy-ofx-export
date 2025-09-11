import { describe, it, expect, vi } from 'vitest';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as configureCommand from '../src/commands/configure';
import * as syncCommand from '../src/commands/sync';

const cli = yargs(hideBin(process.argv))
  .command(
    'configure',
    'Configure Pluggy and YNAB API keys',
    (yargs) => {
      return yargs
        .option('pluggy-client-id', {
          describe: 'Your Pluggy.ai Client ID',
          type: 'string',
        })
        .option('pluggy-client-secret', {
          describe: 'Your Pluggy.ai Client Secret',
          type: 'string',
        })
        .option('ynab-api-key', {
          describe: 'Your YNAB API key',
          type: 'string',
        });
    },
    (argv) => {
      configureCommand.configure(argv);
    }
  )
  .command(
    'sync',
    'Synchronize transactions',
    (yargs) => {
      return yargs
        .option('account', {
          describe: 'Account mapping in the format pluggy_account_id:ynab_budget_id:ynab_account_id',
          type: 'string',
        })
        .option('from', {
          describe: 'Start date for synchronization (YYYY-MM-DD)',
          type: 'string',
        });
    },
    (argv) => {
      syncCommand.sync(argv);
    }
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help();

describe('CLI Contracts', () => {
  it('should call configure function with correct arguments', async () => {
    const configureSpy = vi.spyOn(configureCommand, 'configure');
    await cli.parse('configure --pluggy-client-id FAKE_ID --pluggy-client-secret FAKE_SECRET --ynab-api-key FAKE_KEY');
    expect(configureSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pluggyClientId: 'FAKE_ID',
        pluggyClientSecret: 'FAKE_SECRET',
        ynabApiKey: 'FAKE_KEY',
      })
    );
  });

  it('should call sync function with correct arguments', async () => {
    const syncSpy = vi.spyOn(syncCommand, 'sync');
    await cli.parse('sync --account PLUGGY_ID:BUDGET_ID:YNAB_ID');
    expect(syncSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        account: 'PLUGGY_ID:BUDGET_ID:YNAB_ID',
      })
    );
  });
});
