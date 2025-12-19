import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { Alert } from 'app/interfaces/alert.interface';
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

  describe('getLinkForAlert', () => {
    it('returns boot pool link for boot pool capacity alerts', () => {
      const alert = {
        klass: AlertClassName.ZpoolCapacityCritical,
        args: { volume: 'boot-pool', capacity: 96 },
      } as Alert;

      const link = spectator.service.getLinkForAlert(alert);
      expect(link).toMatchObject({
        label: 'Manage boot pool',
        route: ['/system', 'boot'],
      });
    });

    it('returns boot pool link for freenas-boot capacity alerts', () => {
      const alert = {
        klass: AlertClassName.ZpoolCapacityWarning,
        args: { volume: 'freenas-boot', capacity: 91 },
      } as Alert;

      const link = spectator.service.getLinkForAlert(alert);
      expect(link).toMatchObject({
        label: 'Manage boot pool',
        route: ['/system', 'boot'],
      });
    });

    it('returns storage link for regular pool capacity alerts', () => {
      const alert = {
        klass: AlertClassName.ZpoolCapacityCritical,
        args: { volume: 'tank', capacity: 96 },
      } as Alert;

      const link = spectator.service.getLinkForAlert(alert);
      expect(link).toMatchObject({
        label: 'Go to Storage',
        route: ['/storage'],
      });
    });

    it('handles missing args gracefully', () => {
      const alert = {
        klass: AlertClassName.ZpoolCapacityNotice,
        args: null,
      } as Alert;

      const link = spectator.service.getLinkForAlert(alert);
      // Falls back to default storage link
      expect(link).toMatchObject({
        label: 'Go to Storage',
        route: ['/storage'],
      });
    });
  });

  describe('openLinkForAlert', () => {
    it('navigates to boot pool for boot pool capacity alerts', () => {
      const alert = {
        klass: AlertClassName.ZpoolCapacityCritical,
        args: { volume: 'boot-pool', capacity: 96 },
      } as Alert;

      spectator.service.openLinkForAlert(alert);

      expect(spectator.inject(NavigateAndHighlightService).navigateAndHighlight).toHaveBeenCalledWith(
        ['/system', 'boot'],
        undefined,
      );
    });
  });
});
