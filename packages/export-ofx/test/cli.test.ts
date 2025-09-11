import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

const cliCommand = 'npx tsx ./packages/export-ofx/bin/index.ts';

describe('CLI Contracts', () => {
  describe('configure', () => {
    it('should store API keys when valid keys are provided', () => {
      // This test will fail until the configure command is implemented
      const output = execSync(`${cliCommand} configure --pluggy-api-key FAKE_KEY --ynab-api-key FAKE_KEY`);
      expect(output.toString()).toContain('Configuration saved successfully.');
    });

    it('should return an error if keys are invalid', () => {
        // This test will fail until the configure command is implemented
        expect(() => {
            execSync(`${cliCommand} configure --pluggy-api-key INVALID --ynab-api-key INVALID`);
        }).toThrow();
    });

    it('should return an error if pluggy-api-key is missing', () => {
        // This test will fail until the configure command is implemented
        expect(() => {
            execSync(`${cliCommand} configure --ynab-api-key FAKE_KEY`);
        }).toThrow();
    });

    it('should return an error if ynab-api-key is missing', () => {
        // This test will fail until the configure command is implemented
        expect(() => {
            execSync(`${cliCommand} configure --pluggy-api-key FAKE_KEY`);
        }).toThrow();
    });
  });

  describe('sync', () => {
    it('should sync transactions for the specified accounts', () => {
        // This test will fail until the sync command is implemented
        const output = execSync(`${cliCommand} sync --account PLUGGY_ID:YNAB_ID`);
        expect(output.toString()).toContain('Synchronization complete.');
    });

    it('should return an error if account mapping is missing', () => {
        // This test will fail until the sync command is implemented
        expect(() => {
            execSync(`${cliCommand} sync`);
        }).toThrow();
    });

    it('should accept a "from" date for synchronization', () => {
        // This test will fail until the sync command is implemented
        const output = execSync(`${cliCommand} sync --account PLUGGY_ID:YNAB_ID --from 2025-01-01`);
        expect(output.toString()).toContain('Synchronization complete.');
    });
  });
});
