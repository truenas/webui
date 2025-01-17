import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLinkService } from 'app/modules/alerts/services/alert-link.service';

describe('AlertLinkService', () => {
  let spectator: SpectatorService<AlertLinkService>;
  const createService = createServiceFactory({
    service: AlertLinkService,
    providers: [
      mockProvider(NavigateAndHighlightService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('getLink', () => {
    it('return a link for a given alert class', () => {
      const link = spectator.service.getLink(AlertClassName.ApiFailedLogin);
      expect(link).toMatchObject({
        label: 'Go to API keys',
      });
    });

    it('returns null when there is no supported link for an alert class', () => {
      const link = spectator.service.getLink(AlertClassName.UpsOnline);
      expect(link).toBeNull();
    });
  });

  describe('openLink', () => {
    it('navigates to an alert link by its class', () => {
      spectator.service.openLink(AlertClassName.ApiFailedLogin);

      expect(spectator.inject(NavigateAndHighlightService).navigateAndHighlight).toHaveBeenCalledWith(
        ['/credentials', 'users', 'api-keys'],
        undefined,
      );
    });
  });
});
