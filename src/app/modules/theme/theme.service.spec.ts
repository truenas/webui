import { TnThemeService, TnTheme } from '@ixsystems/truenas-ui';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { ThemeService } from 'app/modules/theme/theme.service';
import { selectTheme } from 'app/store/preferences/preferences.selectors';

describe('ThemeService', () => {
  let spectator: SpectatorService<ThemeService>;

  const createService = createServiceFactory({
    service: ThemeService,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectTheme,
            value: 'ix-dark',
          },
        ],
      }),
      mockWindow(),
      mockProvider(TnThemeService, {
        setTheme: jest.fn(() => true),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('darkTest', () => {
    it('returns true when provided color is dark', () => {
      expect(spectator.service.darkTest('#000000')).toBe(true);
      expect(spectator.service.darkTest('#FFFFFF')).toBe(false);

      expect(spectator.service.darkTest('hsl(0, 0%, 0%)')).toBe(true);
      expect(spectator.service.darkTest('hsl(0, 0%, 100%)')).toBe(false);
      expect(spectator.service.darkTest('hsl(0, 0%, 49%)')).toBe(true);
      expect(spectator.service.darkTest('hsl(0, 0%, 50%)')).toBe(false);
    });
  });

  describe('theme synchronization with component library', () => {
    it('synchronizes component library theme when WebUI theme changes', () => {
      const tnThemeService = spectator.inject(TnThemeService);
      jest.clearAllMocks();

      spectator.service.onThemeChanged('ix-dark');

      expect(tnThemeService.setTheme).toHaveBeenCalledWith(TnTheme.Dark);
    });

    it('maps all WebUI themes to correct component library themes', () => {
      const tnThemeService = spectator.inject(TnThemeService);
      const themeMap = spectator.service.webuiToComponentLibraryThemeMap;

      Object.entries(themeMap).forEach(([webuiTheme, tnTheme]) => {
        jest.clearAllMocks();
        spectator.service.onThemeChanged(webuiTheme);
        expect(tnThemeService.setTheme).toHaveBeenCalledWith(tnTheme);
      });
    });

    it('does not call TnThemeService.setTheme for unmapped themes', () => {
      const tnThemeService = spectator.inject(TnThemeService);
      jest.clearAllMocks();

      spectator.service.onThemeChanged('unknown-theme');

      expect(tnThemeService.setTheme).not.toHaveBeenCalled();
    });
  });
});
