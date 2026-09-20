import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnThemeService, TnTheme } from '@truenas/ui-components';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { ThemeService } from 'app/modules/theme/theme.service';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';
import { themeClassByStoredName as e2eThemeClassByStoredName } from '../../../../e2e/locators/preferences';

describe('ThemeService', () => {
  let spectator: SpectatorService<ThemeService>;
  let store$: MockStore;
  let mediaChangeHandler: () => void;
  const mediaQueryState = { matches: false };
  const matchMediaMock = jest.fn().mockImplementation(() => ({
    get matches() { return mediaQueryState.matches; },
    addEventListener: jest.fn((_, handler: () => void) => {
      mediaChangeHandler = handler;
    }),
  }));

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
        matchMedia: matchMediaMock,
      }),
      mockProvider(TnThemeService, {
        setTheme: jest.fn(() => true),
      }),
    ],
  });

  beforeEach(() => {
    mediaQueryState.matches = false;
    spectator = createService();
    store$ = spectator.inject(MockStore);
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

    /**
     * Holds the E2E suite's copy of this map to this one.
     *
     * `e2e/locators/preferences.ts` duplicates it rather than importing
     * `ThemeService`, because the Playwright runner is a Node process with no
     * Angular platform — the same reason `e2e/locators/test-id.ts` copies
     * `kebabTestSegment`, and guarded the same way, here under `src/` because
     * Jest ignores `e2e/`.
     *
     * Without this, a theme renamed on either side desynchronizes silently and
     * surfaces as an E2E assertion about a CSS class failing twenty minutes into
     * a run, pointing at the preferences form rather than at a stale map.
     */
    it('matches the map the E2E suite asserts theme classes with', () => {
      expect(e2eThemeClassByStoredName).toStrictEqual(spectator.service.webuiToComponentLibraryThemeMap);
    });

    it('does not call TnThemeService.setTheme for unmapped themes', () => {
      const tnThemeService = spectator.inject(TnThemeService);
      jest.clearAllMocks();

      spectator.service.onThemeChanged('unknown-theme');

      expect(tnThemeService.setTheme).not.toHaveBeenCalled();
    });
  });

  describe('sync with OS', () => {
    it('uses light theme when OS is in light mode and sync is enabled', () => {
      mediaQueryState.matches = false;

      store$.overrideSelector(selectPreferencesState, {
        areLoaded: true,
        preferences: {
          userTheme: 'ix-dark',
          syncThemeWithOS: true,
          lightTheme: 'ix-blue',
          darkTheme: 'ix-dark',
        },
        previewTheme: null,
        dashboardState: null,
      });
      store$.refreshState();

      expect(spectator.service.activeTheme).toBe('ix-blue');
    });

    it('uses dark theme when OS is in dark mode and sync is enabled', () => {
      mediaQueryState.matches = true;

      store$.overrideSelector(selectPreferencesState, {
        areLoaded: true,
        preferences: {
          userTheme: 'ix-blue',
          syncThemeWithOS: true,
          lightTheme: 'ix-blue',
          darkTheme: 'ix-dark',
        },
        previewTheme: null,
        dashboardState: null,
      });
      store$.refreshState();

      expect(spectator.service.activeTheme).toBe('ix-dark');
    });

    it('uses preview theme over OS sync when preview is active', () => {
      store$.overrideSelector(selectPreferencesState, {
        areLoaded: true,
        preferences: {
          userTheme: 'ix-dark',
          syncThemeWithOS: true,
          lightTheme: 'ix-blue',
          darkTheme: 'ix-dark',
        },
        previewTheme: 'dracula',
        dashboardState: null,
      });
      store$.refreshState();

      expect(spectator.service.activeTheme).toBe('dracula');
    });

    it('switches theme when OS appearance changes', () => {
      mediaQueryState.matches = false;

      store$.overrideSelector(selectPreferencesState, {
        areLoaded: true,
        preferences: {
          userTheme: 'ix-dark',
          syncThemeWithOS: true,
          lightTheme: 'ix-blue',
          darkTheme: 'ix-dark',
        },
        previewTheme: null,
        dashboardState: null,
      });
      store$.refreshState();

      expect(spectator.service.activeTheme).toBe('ix-blue');

      mediaQueryState.matches = true;
      mediaChangeHandler();

      expect(spectator.service.activeTheme).toBe('ix-dark');
    });
  });
});
