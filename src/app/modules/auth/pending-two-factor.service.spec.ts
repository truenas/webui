import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { WINDOW } from 'app/helpers/window.helper';
import { PendingTwoFactorService } from 'app/modules/auth/pending-two-factor.service';

describe('PendingTwoFactorService', () => {
  let spectator: SpectatorService<PendingTwoFactorService>;
  const storage = new Map<string, string>();
  const dayMs = 24 * 60 * 60 * 1000;

  const createService = createServiceFactory({
    service: PendingTwoFactorService,
    providers: [
      {
        provide: WINDOW,
        useValue: {
          localStorage: {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
            removeItem: (key: string) => storage.delete(key),
          },
        },
      },
    ],
  });

  beforeEach(() => {
    storage.clear();
    jest.spyOn(Date, 'now').mockReturnValue(0);
    spectator = createService();
  });

  afterEach(() => jest.restoreAllMocks());

  it('reports the kind that was stored for an account', () => {
    spectator.service.set('dummy', 'renewal');

    expect(spectator.service.get('dummy')).toBe('renewal');
    expect(spectator.service.get('someone-else')).toBeNull();
  });

  it('forgets a marker once it is older than the bound', () => {
    // Nothing outside this browser can clear it, so confirming the same secret elsewhere
    // would otherwise leave this one re-opening the disableClose setup dialog forever.
    spectator.service.set('dummy', 'setup');
    jest.spyOn(Date, 'now').mockReturnValue(8 * dayMs);

    expect(spectator.service.get('dummy')).toBeNull();
    // Dropped rather than left to be re-judged on every guard run.
    expect(storage.has('pending2FaVerification:dummy')).toBe(false);
  });

  it('keeps a marker that is within the bound, so a slow setup is not cut short', () => {
    spectator.service.set('dummy', 'setup');
    jest.spyOn(Date, 'now').mockReturnValue(6 * dayMs);

    expect(spectator.service.get('dummy')).toBe('setup');
  });

  it('ignores a stored value it did not write', () => {
    // The key is reachable by anything else on this origin, and an unstamped or malformed
    // value carries no age — treat it as no marker rather than as one that never expires.
    storage.set('pending2FaVerification:dummy', 'renewal');

    expect(spectator.service.get('dummy')).toBeNull();
  });
});
