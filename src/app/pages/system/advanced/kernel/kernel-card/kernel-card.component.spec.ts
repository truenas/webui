import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KernelCardComponent } from 'app/pages/system/advanced/kernel/kernel-card/kernel-card.component';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('KernelCardComponent', () => {
  let spectator: Spectator<KernelCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: KernelCardComponent,
    providers: [
      mockAuth(),
      mockProvider(ChainedSlideInService, {
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
              debugkernel: true,
            },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows kernel related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Enable Debug Kernel: Enabled',
    ]);
  });

  it('opens Kernel form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      KernelFormComponent,
      false,
      true,
    );
  });
});
