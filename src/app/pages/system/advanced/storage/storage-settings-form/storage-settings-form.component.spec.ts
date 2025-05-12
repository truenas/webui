import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Weekday } from 'app/enums/weekday.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { Service } from 'app/interfaces/service.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { WarningHarness } from 'app/modules/forms/ix-forms/components/warning/warning.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import {
  StorageSettingsData,
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('StorageSettingsFormComponent', () => {
  let spectator: Spectator<StorageSettingsFormComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;
  const createComponent = createComponentFactory({
    component: StorageSettingsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('systemdataset.pool_choices', {
          'current-pool': 'current-pool',
          'new-pool': 'new-pool',
        }),
        mockCall('systemdataset.config', {
          pool: 'current-pool',
        } as SystemDatasetConfig),
        mockJob('systemdataset.update', fakeSuccessfulJob()),
        mockCall('pool.resilver.update'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [{
              service: ServiceName.Cifs,
              state: ServiceStatus.Running,
            } as Service],
          },
        ],
      }),
      mockProvider(LocaleService),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn(() => ({
          systemDatasetPool: 'current-pool',
          priorityResilver: {
            enabled: false,
          },
        } as StorageSettingsData)),
        requireConfirmationWhen: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(MockApiService);
  });

  it('loads and shows current storage settings', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'System Dataset Pool': 'current-pool',
      'Run Resilvering At Higher Priority At Certain Times': false,
    });
  });

  it('updates system dataset and refreshes settings when system dataset pool is changed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'System Dataset Pool': 'new-pool',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('systemdataset.update', [{
      pool: 'new-pool',
    }]);
    expect(api.call).not.toHaveBeenCalledWith('pool.resilver.update', expect.anything());
  });

  it('updates resilver settings when they are changed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Run Resilvering At Higher Priority At Certain Times': true,
      From: '19:00:00',
      To: '22:00:00',
      'Days of the Week': ['Monday', 'Friday'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('pool.resilver.update', [{
      enabled: true,
      begin: '19:00',
      end: '22:00',
      weekday: [Weekday.Monday, Weekday.Friday],
    }]);
    expect(api.job).not.toHaveBeenCalledWith('systemdataset.update', expect.anything());
  });

  it('updates both system dataset and resilver config when they are changed together', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'System Dataset Pool': 'new-pool',
      'Run Resilvering At Higher Priority At Certain Times': true,
      From: '19:00:00',
      To: '22:00:00',
      'Days of the Week': ['Monday', 'Friday'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('systemdataset.update', [{
      pool: 'new-pool',
    }]);
    expect(api.call).toHaveBeenCalledWith('pool.resilver.update', [{
      enabled: true,
      begin: '19:00',
      end: '22:00',
      weekday: [Weekday.Monday, Weekday.Friday],
    }]);
  });

  it('should warns user about restarting an SMB service when it is running', async () => {
    const warning = await loader.getHarness(WarningHarness);
    expect(await warning.getText()).toBe(helptextSystemAdvanced.storageSettings.smbRebootWarning);
  });
});
