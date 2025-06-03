import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { StorageCardComponent } from 'app/pages/system/advanced/storage/storage-card/storage-card.component';
import {
  StorageSettingsData,
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
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
        mockCall('pool.resilver.config', {
          enabled: true,
          begin: '15:00',
          end: '17:00',
          weekday: [2, 3],
        } as ResilverConfig),
      ]),
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

  it('shows Storage related settings', async () => {
    const items = await loader.getAllHarnesses(MatListItemHarness);
    const itemTexts = await parallel(() => items.map((item) => item.getFullText()));

    expect(itemTexts).toEqual([
      'System Dataset Pool: tank',
      'Resilvering At Higher Priority: Between 15:00 and 17:00 on Tuesday, Wednesday',
    ]);
  });

  it('opens Storage form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      StorageSettingsFormComponent,
      {
        data: {
          priorityResilver: {
            enabled: true,
            begin: '15:00',
            end: '17:00',
            weekday: [2, 3],
          },
          systemDatasetPool: 'tank',
        } as StorageSettingsData,
      },
    );
  });
});
