import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ChainedRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/chained-component-ref';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  ReplicationSettingsCardComponent,
} from 'app/pages/system/advanced/replication/replication-settings-card/replication-settings-card.component';
import {
  ReplicationSettingsFormComponent,
} from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

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
      mockProvider(AdvancedSettingsService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(IxChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(ChainedRef, { close: jest.fn(), getData: jest.fn(() => undefined) }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Replication related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'Replication Tasks Limit: 5',
    ]);
  });

  it('opens Replication Settings form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(
      spectator.inject(IxChainedSlideInService).open,
    ).toHaveBeenCalledWith(
      ReplicationSettingsFormComponent,
      false,
      { max_parallel_replication_tasks: 5 },
    );
  });
});
