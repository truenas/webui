import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiService } from 'app/modules/websocket/api.service';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { lifetimeTokenUpdated } from 'app/store/preferences/preferences.actions';
import { PreferencesEffects } from 'app/store/preferences/preferences.effects';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('PreferencesEffects', () => {
  let spectator: SpectatorService<PreferencesEffects>;

  const actions$ = new ReplaySubject<unknown>(1);
  const createService = createServiceFactory({
    service: PreferencesEffects,
    providers: [
      provideMockActions(() => actions$),
      mockApi([
        mockCall('auth.set_attribute'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: defaultPreferences,
          },
        ],
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('save updated preferences', () => {
    actions$.next(lifetimeTokenUpdated({ lifetime: defaultPreferences.lifetime }));
    spectator.service.saveUpdatedPreferences$.subscribe();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'auth.set_attribute',
      ['preferences', defaultPreferences],
    );
  });
});
