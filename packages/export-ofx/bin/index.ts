import 'dotenv/config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { configure } from '../src/commands/configure';
import { sync } from '../src/commands/sync';

yargs(hideBin(process.argv))
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
      configure(argv);
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
      sync(argv);
    }
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help().argv;
