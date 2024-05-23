import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { DetectBrowserService } from 'app/services/detect-browser.service';

describe('DetectBrowserService', () => {
  let spectator: SpectatorService<DetectBrowserService>;
  const createService = createServiceFactory({
    service: DetectBrowserService,
    providers: [
      mockWindow({
        navigator: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('matchesBrowser', () => {
    it('returns true when browser matches specified string', () => {
      expect(spectator.service.matchesBrowser('Chrome')).toBe(true);
      expect(spectator.service.matchesBrowser('Safari')).toBe(false);
    });
  });

  describe('isMacOs', () => {
    it('returns true when user agent includes Macintosh', () => {
      expect(spectator.service.isMacOs()).toBe(true);
    });
  });
});
