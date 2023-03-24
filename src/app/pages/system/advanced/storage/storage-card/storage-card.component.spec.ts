import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatListItemHarness } from '@angular/material/list/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { StorageCardComponent } from 'app/pages/system/advanced/storage/storage-card/storage-card.component';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('StorageCardComponent', () => {
  let spectator: Spectator<StorageCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: StorageCardComponent,
    providers: [
      mockWebsocket([
        mockCall('systemdataset.config', {
          pool: 'tank',
        } as SystemDatasetConfig),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              swapondrive: 3,
            },
          },
        ],
      }),
      mockProvider(AdvancedSettingsService),
      mockProvider(IxSlideInService, {
        onClose$: of(),
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
      'Swap Size: 3 GiB',
    ]);
  });

  it('opens Storage form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(StorageSettingsFormComponent);
  });
});
