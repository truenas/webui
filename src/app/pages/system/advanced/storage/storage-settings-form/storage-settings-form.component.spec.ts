import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Weekday } from 'app/enums/weekday.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ResilverConfig } from 'app/interfaces/resilver-config.interface';
import { Service } from 'app/interfaces/service.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { WarningHarness } from 'app/modules/forms/ix-forms/components/warning/warning.harness';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import {
  StorageSettingsFormComponent,
} from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('StorageSettingsFormComponent', () => {
  let spectator: Spectator<StorageSettingsFormComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;

  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

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
        mockCall('pool.resilver.config', {
          enabled: false,
        } as ResilverConfig),
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
    expect(await (await getSelect('systemDatasetPool')).getDisplayText()).toBe('current-pool');
    expect(await (await getCheckbox('enabled')).isChecked()).toBe(false);
  });

  it('updates system dataset and refreshes settings when system dataset pool is changed', async () => {
    await (await getSelect('systemDatasetPool')).selectOption('new-pool');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('systemdataset.update', [{
      pool: 'new-pool',
    }]);
    expect(api.call).not.toHaveBeenCalledWith('pool.resilver.update', expect.anything());
  });

  it('updates resilver settings when they are changed', async () => {
    await (await getCheckbox('enabled')).check();
    // Default selection is all seven days; toggle off everything except Monday and Friday.
    const weekday = await getSelect('weekday');
    await weekday.selectOption('Tuesday');
    await weekday.selectOption('Wednesday');
    await weekday.selectOption('Thursday');
    await weekday.selectOption('Saturday');
    await weekday.selectOption('Sunday');
    await (await getSelect('begin')).selectOption('19:00:00');
    await (await getSelect('end')).selectOption('22:00:00');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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
    await (await getSelect('systemDatasetPool')).selectOption('new-pool');
    await (await getCheckbox('enabled')).check();
    const weekday = await getSelect('weekday');
    await weekday.selectOption('Tuesday');
    await weekday.selectOption('Wednesday');
    await weekday.selectOption('Thursday');
    await weekday.selectOption('Saturday');
    await weekday.selectOption('Sunday');
    await (await getSelect('begin')).selectOption('19:00:00');
    await (await getSelect('end')).selectOption('22:00:00');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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

  it('closes the form with no requests if no changes were made', async () => {
    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
      response: false,
    });
    expect(api.call).not.toHaveBeenCalledWith('pool.resilver.update', expect.anything());
    expect(api.job).not.toHaveBeenCalledWith('systemdataset.update', expect.anything());
  });
});
