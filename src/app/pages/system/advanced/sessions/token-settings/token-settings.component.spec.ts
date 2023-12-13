import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { TokenSettingsComponent } from 'app/pages/system/advanced/sessions/token-settings/token-settings.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { lifetimeTokenUpdated } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('TokenSettingsComponent', () => {
  let spectator: Spectator<TokenSettingsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: TokenSettingsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWindow({
        localStorage: {
          setItem: jest.fn,
        },
      }),
      mockWebsocket([
        mockCall('system.general.update'),
      ]),
      mockProvider(IxSlideInService),
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
        }],
      }),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
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
      'Token Lifetime': '300',
      'Allow Directory Service users to access WebUI': true,
    });
  });

  it('updates settings when save is pressed', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Token Lifetime': '60',
      'Allow Directory Service users to access WebUI': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(store$.dispatch).toHaveBeenCalledWith(lifetimeTokenUpdated({ lifetime: 60 }));
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('system.general.update', [{
      ds_auth: false,
    }]);
    expect(store$.dispatch).toHaveBeenCalledWith(generalConfigUpdated());
    expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
  });
});
