import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';

const cliCommand = 'npx tsx ./packages/export-ofx/bin/index.ts';

describe('Main User Story Integration Test', () => {
  beforeAll(() => {
    // This is where we would set up our mock servers for Pluggy and YNAB
    // For now, we'll just configure the CLI with fake keys
    execSync(`${cliCommand} configure --pluggy-api-key FAKE_PLUGGY_KEY --ynab-api-key FAKE_YNAB_KEY`);
  });

  it('should automatically export banking data from Pluggy to YNAB', () => {
    // This test will fail until the full implementation is complete.
    // It requires mock APIs for Pluggy and YNAB to be set up.

    // 1. Mock Pluggy API to return some transactions
    // 2. Mock YNAB API to receive transactions

    // 3. Run the sync command
    const syncOutput = execSync(`${cliCommand} sync --account MOCK_PLUGGY_ID:MOCK_YNAB_ID`);

    // 4. Assert that the sync was successful
    expect(syncOutput.toString()).toContain('Synchronization complete.');

    // 5. Assert that the mock YNAB API was called with the correct transactions
    // (This part requires a mock server and inspection of its calls)
  });
});
