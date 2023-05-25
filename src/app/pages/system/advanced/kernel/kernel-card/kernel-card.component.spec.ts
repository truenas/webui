import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { KernelCardComponent } from 'app/pages/system/advanced/kernel/kernel-card/kernel-card.component';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('KernelCardComponent', () => {
  let spectator: Spectator<KernelCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: KernelCardComponent,
    providers: [
      mockProvider(IxSlideInService),
      mockProvider(AdvancedSettingsService),
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

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(KernelFormComponent, {
      data: true,
    });
  });
});
