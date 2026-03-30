import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { ThemeService } from 'app/modules/theme/theme.service';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';

describe('ThemeService', () => {
  let spectator: SpectatorService<ThemeService>;

  const createService = createServiceFactory({
    service: ThemeService,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectPreferencesState,
            value: {
              areLoaded: true,
              preferences: { userTheme: 'ix-dark', syncThemeWithOS: false },
              previewTheme: null,
            },
          },
        ],
      }),
      mockWindow({
        matchMedia: jest.fn().mockReturnValue({
          matches: false,
          addEventListener: jest.fn(),
        }),
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
});
