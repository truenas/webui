import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  NvidiaDriversCardComponent,
} from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-card/nvidia-drivers-card.component';
import {
  NvidiaDriversFormComponent,
} from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-form/nvidia-drivers-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('NvidiaDriversCardComponent', () => {
  let spectator: Spectator<NvidiaDriversCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: NvidiaDriversCardComponent,
    providers: [
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: { nvidia: false },
          },
        ],
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows NVIDIA drivers status as disabled when nvidia config is false', async () => {
    const statusItem = await loader.getHarness(MatListItemHarness);
    expect(await statusItem.getFullText()).toContain('Install NVIDIA Drivers:');
    expect(await statusItem.getFullText()).toContain('Disabled');
  });

  it('shows NVIDIA drivers status as enabled when nvidia config is true', async () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectAdvancedConfig, { nvidia: true });
    store$.refreshState();
    spectator.detectChanges();

    const statusItem = await loader.getHarness(MatListItemHarness);
    expect(await statusItem.getFullText()).toContain('Enabled');
  });

  it('opens NVIDIA Drivers form when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NvidiaDriversFormComponent, { data: false });
  });

  it('passes current nvidia enabled state to form', async () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectAdvancedConfig, { nvidia: true });
    store$.refreshState();
    spectator.detectChanges();

    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NvidiaDriversFormComponent, { data: true });
  });
});
