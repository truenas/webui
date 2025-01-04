import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AccessFormComponent } from 'app/pages/system/advanced/access/access-form/access-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { lifetimeTokenUpdated } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { advancedConfigUpdated, generalConfigUpdated, loginBannerUpdated } from 'app/store/system-config/system-config.actions';
import { selectAdvancedConfig, selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('AccessFormComponent', () => {
  let spectator: Spectator<AccessFormComponent>;
  let loader: HarnessLoader;
  const slideInRef: SlideInRef<unknown, unknown> = {
    close: jest.fn(),
    getData: jest.fn(() => undefined),
    requireConfirmationWhen: jest.fn(),
  };
  const createComponent = createComponentFactory({
    component: AccessFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWindow({
        localStorage: {
          setItem: jest.fn,
        },
        sessionStorage: {
          setItem: jest.fn,
        },
      }),
      mockApi([
        mockCall('system.general.update'),
        mockCall('system.advanced.update'),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of(true)),
        components$: of([]),
      }),
      mockProvider(SystemGeneralService, {
        isEnterprise: jest.fn(() => true),
      }),
      provideMockStore({
        selectors: [{
          selector: selectPreferences,
          value: { lifetime: 300 } as Preferences,
        }, {
          selector: selectGeneralConfig,
          value: { ds_auth: true },
        }, {
          selector: selectAdvancedConfig,
          value: { login_banner: 'test' },
        }],
      }),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows settings values when form is being edited', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Session Timeout': '300',
      'Login Banner': 'test',
      'Allow Directory Service users to access WebUI': true,
    });
  });

  it('updates settings when save is pressed', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Session Timeout': '60',
      'Login Banner': '',
      'Allow Directory Service users to access WebUI': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(store$.dispatch).toHaveBeenCalledWith(lifetimeTokenUpdated({ lifetime: 60 }));
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.general.update', [{
      ds_auth: false,
    }]);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.advanced.update', [{
      login_banner: '',
    }]);
    expect(store$.dispatch).toHaveBeenCalledWith(generalConfigUpdated());
    expect(store$.dispatch).toHaveBeenCalledWith(advancedConfigUpdated());
    expect(store$.dispatch).toHaveBeenCalledWith(loginBannerUpdated({ loginBanner: '' }));
    expect(slideInRef.close).toHaveBeenCalled();
  });
});
