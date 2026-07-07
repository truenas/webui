import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { GiB } from 'app/constants/bytes.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DatasetCapacitySettingsComponent,
} from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';

describe('DatasetCapacitySettingsComponent', () => {
  let spectator: Spectator<DatasetCapacitySettingsComponent>;
  let loader: HarnessLoader;

  const dataset = {
    id: 'root/path',
    name: 'root/path',
    refquota: { parsed: 50 * GiB },
    quota: { parsed: 100 * GiB },
    refreservation: { parsed: 10 * GiB },
    reservation: { parsed: 20 * GiB },
    user_properties: {
      refquota_warning: {
        parsed: 50,
        rawvalue: '50',
        value: '50',
        source: ZfsPropertySource.Local,
      },
      refquota_critical: {
        parsed: 0,
        rawvalue: '0',
        value: '0',
        source: ZfsPropertySource.Default,
      },
      quota_warning: {
        parsed: null,
        rawvalue: '',
        value: '',
        source: ZfsPropertySource.Local,
      },
      quota_critical: {
        parsed: 0,
        rawvalue: '0',
        value: '0',
        source: ZfsPropertySource.Inherited,
      },
    } as Record<string, ZfsProperty<string, string | number | null>>,
  } as DatasetDetails;

  const slideInRef: SlideInRef<DatasetDetails | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => dataset),
  };

  const createComponent = createComponentFactory({
    component: DatasetCapacitySettingsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('pool.dataset.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockProvider(SlideIn),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const clickSave = async (): Promise<void> => {
    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();
  };

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current capacity settings for a dataset', async () => {
    const values = {
      refquota: await (await getInput('refquota')).getValue(),
      quota: await (await getInput('quota')).getValue(),
      refreservation: await (await getInput('refreservation')).getValue(),
      reservation: await (await getInput('reservation')).getValue(),
      refquotaWarning: await (await getInput('refquota_warning')).getValue(),
      refquotaCritical: await (await getInput('refquota_critical')).getValue(),
      quotaWarning: await (await getInput('quota_warning')).getValue(),
      quotaCritical: await (await getInput('quota_critical')).getValue(),
      refquotaWarningInherit: await (await getCheckbox('refquota_warning_inherit')).isChecked(),
      refquotaCriticalInherit: await (await getCheckbox('refquota_critical_inherit')).isChecked(),
      quotaWarningInherit: await (await getCheckbox('quota_warning_inherit')).isChecked(),
      quotaCriticalInherit: await (await getCheckbox('quota_critical_inherit')).isChecked(),
    };

    expect(values).toEqual({
      quota: '100 GiB',
      quotaCritical: '0',
      quotaCriticalInherit: true,
      quotaWarning: '80',
      quotaWarningInherit: false,
      refquota: '50 GiB',
      refquotaCritical: '0',
      refquotaCriticalInherit: true,
      refquotaWarning: '50',
      refquotaWarningInherit: false,
      refreservation: '10 GiB',
      reservation: '20 GiB',
    });
  });

  it('disables quota fields when inherit is checked', async () => {
    await (await getCheckbox('quota_warning_inherit')).check();
    expect(await (await getInput('quota_warning')).isDisabled()).toBe(true);
  });

  it('saves updated capacity settings when form is submitted', async () => {
    await (await getCheckbox('quota_critical_inherit')).uncheck();
    await (await getCheckbox('refquota_critical_inherit')).check();
    await (await getCheckbox('refquota_warning_inherit')).check();

    await (await getInput('quota')).setValue('110 GiB');
    await (await getInput('quota_warning')).setValue('50');
    await (await getInput('quota_critical')).setValue('90');
    await (await getInput('refreservation')).setValue('15 GiB');
    await (await getInput('reservation')).setValue('25 GiB');
    // Harness rejects an empty setValue, so clear the control directly.
    spectator.component.form.controls.refquota.setValue(null);

    await clickSave();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.update', [
      'root/path',
      {
        quota: 110 * GiB,
        quota_critical: 90,
        quota_warning: 50,
        refquota: 0,
        refquota_warning: inherit,
        refreservation: 15 * GiB,
        reservation: 25 * GiB,
      },
    ]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  it('only sends updated properties on form submit', async () => {
    await (await getCheckbox('quota_critical_inherit')).uncheck();
    await (await getInput('quota')).setValue('105 GiB');
    await (await getInput('quota_critical')).setValue('93');

    await clickSave();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('pool.dataset.update', [
      'root/path',
      {
        quota: 105 * GiB,
        quota_critical: 93,
      },
    ]);
  });
});
