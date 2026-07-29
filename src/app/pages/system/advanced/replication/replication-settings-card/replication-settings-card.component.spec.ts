import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  ReplicationSettingsCardComponent,
} from 'app/pages/system/advanced/replication/replication-settings-card/replication-settings-card.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

describe('ReplicationSettingsCardComponent', () => {
  let spectator: Spectator<ReplicationSettingsCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ReplicationSettingsCardComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('replication.config.config', {
          max_parallel_replication_tasks: 5,
        }),
      ]),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
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

  it('shows Replication related settings', () => {
    const item = spectator.queryAll('.details-item')[0];
    expect(item.textContent.replace(/\s+/g, ' ').trim()).toBe('Replication Tasks Limit: 5');
  });

  it('opens the Replication Settings form when Configure is pressed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'Replication', editData: { max_parallel_replication_tasks: 5 } },
    );
  });
});
