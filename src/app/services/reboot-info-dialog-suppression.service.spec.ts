import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { RebootInfoDialogSuppressionService } from './reboot-info-dialog-suppression.service';

describe('RebootInfoDialogSuppressionService', () => {
  let spectator: SpectatorService<RebootInfoDialogSuppressionService>;
  const createService = createServiceFactory(RebootInfoDialogSuppressionService);

  beforeEach(() => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should start with suppression disabled', () => {
    expect(spectator.service.isSuppressed()).toBe(false);
  });

  it('should enable suppression when suppress() is called', () => {
    spectator.service.suppress();
    expect(spectator.service.isSuppressed()).toBe(true);
  });

  it('should disable suppression when unsuppress() is called', () => {
    spectator.service.suppress();
    spectator.service.unsuppress();
    expect(spectator.service.isSuppressed()).toBe(false);
  });

  it('should handle multiple suppress() calls - last writer wins', () => {
    spectator.service.suppress();
    spectator.service.suppress();
    expect(spectator.service.isSuppressed()).toBe(true);

    spectator.service.unsuppress();
    expect(spectator.service.isSuppressed()).toBe(false);
  });

  it('should handle unsuppress() when already unsuppressed', () => {
    spectator.service.unsuppress();
    expect(spectator.service.isSuppressed()).toBe(false);
  });
});
