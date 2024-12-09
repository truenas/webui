import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { StorageCardComponent } from 'app/pages/system/advanced/storage/storage-card/storage-card.component';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

describe('StorageCardComponent', () => {
  let spectator: Spectator<StorageCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: StorageCardComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('systemdataset.config', {
          pool: 'tank',
        } as SystemDatasetConfig),
      ]),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Storage related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'System Dataset Pool: tank',
    ]);
  });

  it('opens Storage form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(
      spectator.inject(ChainedSlideInService).open,
    ).toHaveBeenCalledWith(
      StorageSettingsFormComponent,
      false,
      { systemDsPool: 'tank' },
    );
  });
});
