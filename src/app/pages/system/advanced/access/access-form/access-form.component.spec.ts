import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { Preferences } from 'app/interfaces/preferences.interface';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AccessFormComponent } from 'app/pages/system/advanced/access/access-form/access-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { lifetimeTokenUpdated } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('AccessFormComponent', () => {
  let spectator: Spectator<AccessFormComponent>;
  let loader: HarnessLoader;
  const chainedRef: ChainedRef<unknown> = { close: jest.fn(), getData: jest.fn(() => undefined) };
  const createComponent = createComponentFactory({
    component: AccessFormComponent,
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
      mockWebSocket([
        mockCall('system.general.update'),
      ]),
      mockProvider(IxChainedSlideInService, {
        pushComponent: jest.fn(() => of(true)),
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
        }],
      }),
      mockProvider(ChainedRef, chainedRef),
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
    expect(chainedRef.close).toHaveBeenCalled();
  });
});
