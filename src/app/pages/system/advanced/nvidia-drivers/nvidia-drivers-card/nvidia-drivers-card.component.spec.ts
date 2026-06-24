import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  NvidiaDriversCardComponent,
} from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-card/nvidia-drivers-card.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('NvidiaDriversCardComponent', () => {
  let spectator: Spectator<NvidiaDriversCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: NvidiaDriversCardComponent,
    providers: [
      mockAuth(),
      mockApi(),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: { nvidia: false },
          },
        ],
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(undefined)),
      }),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => ({ success$: of(true) })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows NVIDIA drivers status as disabled when nvidia config is false', () => {
    const item = spectator.query('.details-item');
    expect(item.textContent.replace(/\s+/g, ' ').trim()).toBe('Enable NVIDIA GPU Support: Disabled');
  });

  it('shows NVIDIA drivers status as enabled when nvidia config is true', () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectAdvancedConfig, { nvidia: true });
    store$.refreshState();
    spectator.detectChanges();

    const item = spectator.query('.details-item');
    expect(item.textContent.replace(/\s+/g, ' ').trim()).toBe('Enable NVIDIA GPU Support: Enabled');
  });

  it('opens NVIDIA Drivers form when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'NVIDIA Drivers', editData: { nvidia: false } },
    );
  });

  it('passes current nvidia enabled state to form', async () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectAdvancedConfig, { nvidia: true });
    store$.refreshState();
    spectator.detectChanges();

    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'NVIDIA Drivers', editData: { nvidia: true } },
    );
  });
});
