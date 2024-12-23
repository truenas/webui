import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { ConsoleCardComponent } from 'app/pages/system/advanced/console/console-card/console-card.component';
import { ConsoleFormComponent } from 'app/pages/system/advanced/console/console-form/console-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { SlideIn } from 'app/services/slide-in';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('ConsoleCardComponent', () => {
  let spectator: Spectator<ConsoleCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ConsoleCardComponent,
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
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

  it('shows console related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Show Text Console without Password Prompt: Enabled',
      'Enable Serial Console: Enabled',
      'Serial Port: ttyS0',
      'Serial Speed: 9600 bps',
      'MOTD Banner: Welcome back',
    ]);
  });

  it('opens Console form when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      ConsoleFormComponent,
      false,
      {
        consolemenu: true,
        motd: 'Welcome back',
        serialconsole: true,
        serialport: 'ttyS0',
        serialspeed: '9600',
      },
    );
  });
});
