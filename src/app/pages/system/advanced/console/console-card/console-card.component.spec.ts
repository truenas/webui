import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ConsoleCardComponent } from 'app/pages/system/advanced/console/console-card/console-card.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('ConsoleCardComponent', () => {
  let spectator: Spectator<ConsoleCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ConsoleCardComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('system.advanced.serial_port_choices', { ttyS0: 'ttyS0', ttyS1: 'ttyS1' }),
        mockCall('system.advanced.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              consolemenu: true,
              serialconsole: true,
              serialport: 'ttyS0',
              serialspeed: '9600',
              motd: 'Welcome back',
            } as AdvancedConfig,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows console related settings', () => {
    const items = spectator.queryAll('.details-item');
    const itemTexts = items.map((item) => item.textContent.replace(/\s+/g, ' ').trim());

    expect(itemTexts).toEqual([
      'Show Text Console without Password Prompt: Enabled',
      'Enable Serial Console: Enabled',
      'Serial Port: ttyS0',
      'Serial Speed: 9600 bps',
      'MOTD Banner: Welcome back',
    ]);
  });

  it('opens the Console form in a side panel when Configure is pressed', async () => {
    expect(spectator.query('ix-console-form')).toBeNull();

    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.query('ix-console-form')).not.toBeNull();
  });
});
