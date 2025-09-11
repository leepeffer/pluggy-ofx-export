import { describe, it, expect, vi } from 'vitest';
import { configure } from './configure';
import * as fs from 'fs';

vi.mock('fs');

describe('configure command', () => {
  it('should write the API keys to the .env file', () => {
    const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync');
    configure({
      pluggyClientId: 'FAKE_ID',
      pluggyClientSecret: 'FAKE_SECRET',
      ynabApiKey: 'FAKE_KEY',
    });
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('PLUGGY_CLIENT_ID=FAKE_ID')
    );
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('PLUGGY_CLIENT_SECRET=FAKE_SECRET')
    );
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('YNAB_API_KEY=FAKE_KEY')
    );
  });
});
