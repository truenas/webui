import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ConsoleConfig } from 'app/pages/system/advanced/console/console-card/console-card.component';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console/console-form/console-form.component';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('ConsoleFormComponent', () => {
  let spectator: Spectator<ConsoleFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
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
        getData: jest.fn(() => ({
          consolemenu: true,
          serialconsole: true,
          serialport: 'ttyS0',
          serialspeed: '9600',
          motd: 'Welcome back, commander',
        } as ConsoleConfig)),
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
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Show Text Console without Password Prompt': true,
      'Enable Serial Console': true,
      'Serial Port': 'ttyS0',
      'Serial Speed': '9600',
      'MOTD Banner': 'Welcome back, commander',
    });
  });

  it('disables Serial Port and Serial Speed controls when Serial Console is disabled', async () => {
    const serialConsoleCheckbox = await loader.getHarness(IxCheckboxHarness.with({
      label: 'Enable Serial Console',
    }));

    await serialConsoleCheckbox.setValue(false);

    const form = await loader.getHarness(IxFormHarness);
    const controls = await form.getControlHarnessesDict();
    const portSelect = await (controls['Serial Port'] as IxSelectHarness).getSelectHarness();
    const speedSelect = await (controls['Serial Speed'] as IxSelectHarness).getSelectHarness();

    expect(await portSelect.isDisabled()).toBe(true);
    expect(await speedSelect.isDisabled()).toBe(true);
  });

  it('saves updated console settings when Save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Show Text Console without Password Prompt': false,
      'Serial Port': 'ttyS1',
      'Serial Speed': '38400',
      'MOTD Banner': 'Oh, hi there',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
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
