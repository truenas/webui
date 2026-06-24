import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
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
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { LocaleService } from 'app/modules/language/locale.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
      ...ixFormTestingProviders(),
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

  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

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

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('systemdataset.update', [{
      pool: 'new-pool',
    }]);
    expect(api.call).not.toHaveBeenCalledWith('pool.resilver.update', expect.anything());
  });

  it('updates resilver settings when they are changed', async () => {
    await (await getCheckbox('enabled')).check();
    await (await getSelect('begin')).selectOption('19:00:00');
    await (await getSelect('end')).selectOption('22:00:00');
    // weekday defaults to every day; deselect all but Monday and Friday.
    const weekday = await getSelect('weekday');
    await weekday.selectOption('Tuesday');
    await weekday.selectOption('Wednesday');
    await weekday.selectOption('Thursday');
    await weekday.selectOption('Saturday');
    await weekday.selectOption('Sunday');

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
    await (await getSelect('systemDatasetPool')).selectOption('new-pool');
    await (await getCheckbox('enabled')).check();
    await (await getSelect('begin')).selectOption('19:00:00');
    await (await getSelect('end')).selectOption('22:00:00');
    // weekday defaults to every day; deselect all but Monday and Friday.
    const weekday = await getSelect('weekday');
    await weekday.selectOption('Tuesday');
    await weekday.selectOption('Wednesday');
    await weekday.selectOption('Thursday');
    await weekday.selectOption('Saturday');
    await weekday.selectOption('Sunday');

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

  it('keeps Save disabled and fires no requests when nothing is changed', async () => {
    // requireDirty=true gates the save button while the form is pristine; the
    // old "close with undefined response" path is now expressed as "Save is
    // simply unavailable", so the caller's success$ never fires.
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(true);

    expect(api.call).not.toHaveBeenCalledWith('pool.resilver.update', expect.anything());
    expect(api.job).not.toHaveBeenCalledWith('systemdataset.update', expect.anything());
  });

  it('closes silently without snackbar when user touches a field and reverts it', async () => {
    // requireDirty only checks form.pristine — typing and reverting flips dirty
    // to true but leaves changedValues empty. preSubmit catches this case.
    await (await getSelect('systemDatasetPool')).selectOption('new-pool');
    await (await getSelect('systemDatasetPool')).selectOption('current-pool');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: undefined });
    expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
    expect(api.call).not.toHaveBeenCalledWith('pool.resilver.update', expect.anything());
    expect(api.job).not.toHaveBeenCalledWith('systemdataset.update', expect.anything());
  });
});
