import { logger } from '@pluggy-ofx-export/core';
import * as fs from 'fs';
import * as path from 'path';

interface ConfigureOptions {
  pluggyClientId?: string;
  pluggyClientSecret?: string;
  ynabApiKey?: string;
}

export function configure(options: ConfigureOptions) {
  if (!options.pluggyClientId || !options.pluggyClientSecret || !options.ynabApiKey) {
    logger.error(
      '--pluggy-client-id, --pluggy-client-secret, and --ynab-api-key are required.'
    );
    process.exit(1);
  }

  const envFilePath = path.resolve(process.cwd(), '.env');
  let envFileContent = '';
  if (fs.existsSync(envFilePath)) {
    envFileContent = fs.readFileSync(envFilePath, 'utf-8');
  }

  const newEnv = envFileContent
    .split('\n')
    .filter(
      line =>
        !line.startsWith('PLUGGY_CLIENT_ID=') &&
        !line.startsWith('PLUGGY_CLIENT_SECRET=') &&
        !line.startsWith('YNAB_API_KEY=')
    )
    .concat([
      `PLUGGY_CLIENT_ID=${options.pluggyClientId}`,
      `PLUGGY_CLIENT_SECRET=${options.pluggyClientSecret}`,
      `YNAB_API_KEY=${options.ynabApiKey}`,
    ])
    .join('\n');

  fs.writeFileSync(envFilePath, newEnv);

  logger.info('Configuration saved successfully to .env file.');
}
