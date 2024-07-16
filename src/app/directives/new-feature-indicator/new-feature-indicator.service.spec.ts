import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { NewFeatureIndicatorService } from 'app/directives/new-feature-indicator/new-feature-indicator.service';
import { Preferences } from 'app/interfaces/preferences.interface';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';

describe('NewFeatureIndicatorService', () => {
  let spectator: SpectatorService<NewFeatureIndicatorService>;
  const createService = createServiceFactory({
    service: NewFeatureIndicatorService,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectPreferencesState,
            value: {
              preferences: {
                shownNewFeatureIndicatorKeys: ['test_key_2'],
              } as Preferences,
            },
          },
        ],
      }),
    ],
  });

  const newIndicator = { key: 'test_key_1', message: 'test_message_1' };
  const existingIndicator = { key: 'test_key_2', message: 'test_message_2' };

  beforeEach(() => {
    spectator = createService();
  });

  describe('wasIndicatorShown', () => {
    it('returns "false" when indicator has not been shown', () => {
      expect(spectator.service.wasIndicatorShown(newIndicator)).toBe(false);
    });

    it('returns "true" when indicator has been shown', () => {
      expect(spectator.service.wasIndicatorShown(existingIndicator)).toBe(true);
    });
  });

  describe('markIndicatorAsShown', () => {
    it('marks the indicator as shown', () => {
      spectator.service.markIndicatorAsShown(newIndicator);
      expect(spectator.service.wasIndicatorShown(newIndicator)).toBe(true);
    });
  });
});
