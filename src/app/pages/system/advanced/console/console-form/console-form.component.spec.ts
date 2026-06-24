import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console/console-form/console-form.component';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('ConsoleFormComponent', () => {
  let spectator: Spectator<ConsoleFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: ConsoleFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('system.advanced.serial_port_choices', {
          ttyS0: 'ttyS0',
          ttyS1: 'ttyS1',
        }),
        mockCall('system.advanced.update'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              consolemenu: true,
              serialconsole: true,
              serialport: 'ttyS0',
              serialspeed: '9600',
              motd: 'Welcome back, commander',
            } as AdvancedConfig,
          },
        ],
      }),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('loads current Console settings and shows them', async () => {
    expect(await (await getCheckbox('consolemenu')).isChecked()).toBe(true);
    expect(await (await getCheckbox('serialconsole')).isChecked()).toBe(true);
    expect(await (await getSelect('serialport')).getDisplayText()).toBe('ttyS0');
    expect(await (await getSelect('serialspeed')).getDisplayText()).toBe('9600');
    expect(await (await getInput('motd')).getValue()).toBe('Welcome back, commander');
  });

  it('disables Serial Port and Serial Speed controls when Serial Console is disabled', async () => {
    await (await getCheckbox('serialconsole')).uncheck();

    expect(await (await getSelect('serialport')).isDisabled()).toBe(true);
    expect(await (await getSelect('serialspeed')).isDisabled()).toBe(true);
  });

  it('saves updated console settings when Save is pressed', async () => {
    await (await getCheckbox('consolemenu')).uncheck();
    await (await getSelect('serialport')).selectOption('ttyS1');
    await (await getSelect('serialspeed')).selectOption('38400');
    await (await getInput('motd')).setValue('Oh, hi there');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{
      consolemenu: false,
      serialconsole: true,
      serialport: 'ttyS1',
      serialspeed: '38400',
      motd: 'Oh, hi there',
    }]);
  });
});
