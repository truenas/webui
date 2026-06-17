import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ConsoleConfig } from 'app/pages/system/advanced/console/console-card/console-card.component';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console/console-form/console-form.component';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

describe('ConsoleFormComponent', () => {
  let spectator: Spectator<ConsoleFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let store$: MockStore;

  const consoleConfig = {
    consolemenu: true,
    serialconsole: true,
    serialport: 'ttyS0',
    serialspeed: '9600',
    motd: 'Welcome back, commander',
  } as ConsoleConfig;

  const checkboxByLabel = (label: string): Promise<TnCheckboxHarness> => {
    return loader.getHarness(TnCheckboxHarness.with({ label }));
  };

  const createComponent = createComponentFactory({
    component: ConsoleFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      ...ixFormTestingProviders(),
      mockApi([
        mockCall('system.advanced.serial_port_choices', { ttyS0: 'ttyS0', ttyS1: 'ttyS1' }),
        mockCall('system.advanced.update'),
      ]),
      provideMockStore(),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
        getData: jest.fn(() => consoleConfig),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    store$ = spectator.inject(MockStore);
    jest.spyOn(store$, 'dispatch');
  });

  it('loads current Console settings and shows them', async () => {
    const motd = await loader.getHarness(TnInputHarness.with({ name: 'motd' }));

    expect(await (await checkboxByLabel('Show Text Console without Password Prompt')).isChecked()).toBe(true);
    expect(await (await checkboxByLabel('Enable Serial Console')).isChecked()).toBe(true);
    expect(await motd.getValue()).toBe('Welcome back, commander');
  });

  it('disables Serial Port and Serial Speed controls when Serial Console is disabled', async () => {
    await (await checkboxByLabel('Enable Serial Console')).uncheck();

    const [serialPort, serialSpeed] = await loader.getAllHarnesses(TnSelectHarness);
    expect(await serialPort.isDisabled()).toBe(true);
    expect(await serialSpeed.isDisabled()).toBe(true);
  });

  it('saves updated console settings and refreshes advanced config when Save is pressed', async () => {
    await (await checkboxByLabel('Show Text Console without Password Prompt')).uncheck();
    await (await loader.getHarness(TnInputHarness.with({ name: 'motd' }))).setValue('Oh, hi there');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{
      consolemenu: false,
      serialconsole: true,
      serialport: 'ttyS0',
      serialspeed: '9600',
      motd: 'Oh, hi there',
    }]);
    expect(store$.dispatch).toHaveBeenCalledWith(advancedConfigUpdated());
  });
});
