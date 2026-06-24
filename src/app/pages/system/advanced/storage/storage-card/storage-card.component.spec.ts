import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { StorageCardComponent } from 'app/pages/system/advanced/storage/storage-card/storage-card.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { selectServices } from 'app/store/services/services.selectors';

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
        mockCall('systemdataset.pool_choices', { tank: 'tank' }),
        mockJob('systemdataset.update', fakeSuccessfulJob()),
        mockCall('pool.resilver.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [],
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows Storage related settings', () => {
    const items = spectator.queryAll('.details-item');
    const itemTexts = items.map((item) => item.textContent.replace(/\s+/g, ' ').trim());

    expect(itemTexts).toEqual([
      'System Dataset Pool: tank',
      'Resilvering At Higher Priority: Between 15:00 and 17:00 on Tuesday, Wednesday',
    ]);
  });

  it('opens the Storage form in a side panel when Configure is pressed', async () => {
    expect(spectator.query('ix-storage-settings-form')).toBeNull();

    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();
    spectator.detectChanges();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.query('ix-storage-settings-form')).not.toBeNull();
  });
});
