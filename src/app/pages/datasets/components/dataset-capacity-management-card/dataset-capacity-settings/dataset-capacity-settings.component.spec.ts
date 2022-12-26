import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { fillControlValues, getControlValues } from 'app/modules/ix-forms/testing/control-harnesses.helpers';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  DatasetCapacitySettingsComponent,
} from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('DatasetCapacitySettingsComponent', () => {
  let spectator: Spectator<DatasetCapacitySettingsComponent>;
  let loader: HarnessLoader;
  const gbs = 1024 ** 3;
  const createComponent = createComponentFactory({
    component: DatasetCapacitySettingsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.dataset.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(IxSlideInService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.setDatasetForEdit({
      id: 'root/path',
      name: 'root/path',
      refquota: { parsed: 50 * gbs },
      refquota_warning: { parsed: 50, source: ZfsPropertySource.Local },
      refquota_critical: { parsed: 0, source: ZfsPropertySource.Default },
      quota: { parsed: 100 * gbs },
      quota_warning: { parsed: null, source: ZfsPropertySource.Local },
      quota_critical: { parsed: 0, source: ZfsPropertySource.Inherited },
      refreservation: { parsed: 10 * gbs },
      reservation: { parsed: 20 * gbs },
    } as DatasetDetails);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  /**
   * Working around labels with duplicate names.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async function getControls() {
    return {
      refquota: await loader.getHarness(IxInputHarness.with({ label: 'Quota for this dataset' })),
      quota: await loader.getHarness(IxInputHarness.with({ label: 'Quota for this dataset and all children' })),
      refreservation: await loader.getHarness(IxInputHarness.with({ label: 'Reserved space for this dataset' })),
      reservation: await loader.getHarness(IxInputHarness.with({ label: 'Reserved space for this dataset and all children' })),
      refquotaWarning: await loader.getHarness(IxInputHarness.with({
        label: 'Quota warning alert at, %',
        ancestor: '.refquota-warning-fields',
      })),
      refquotaWarningInherit: await loader.getHarness(IxCheckboxHarness.with({
        label: 'Inherit',
        ancestor: '.refquota-warning-fields',
      })),
      refquotaCritical: await loader.getHarness(IxInputHarness.with({
        label: 'Quota critical alert at, %',
        ancestor: '.refquota-critical-fields',
      })),
      refquotaCriticalInherit: await loader.getHarness(IxCheckboxHarness.with({
        label: 'Inherit',
        ancestor: '.refquota-critical-fields',
      })),
      quotaWarning: await loader.getHarness(IxInputHarness.with({
        label: 'Quota warning alert at, %',
        ancestor: '.quota-warning-fields',
      })),
      quotaWarningInherit: await loader.getHarness(IxCheckboxHarness.with({
        label: 'Inherit',
        ancestor: '.quota-warning-fields',
      })),
      quotaCritical: await loader.getHarness(IxInputHarness.with({
        label: 'Quota critical alert at, %',
        ancestor: '.quota-critical-fields',
      })),
      quotaCriticalInherit: await loader.getHarness(IxCheckboxHarness.with({
        label: 'Inherit',
        ancestor: '.quota-critical-fields',
      })),
    };
  }

  it('shows current capacity settings for a dataset', async () => {
    const controls = await getControls();
    const values = await getControlValues(controls);

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
    const controls = await getControls();
    await controls['quotaWarningInherit'].setValue(true);
    expect(await controls['quotaWarning'].isDisabled()).toBe(true);
  });

  it('saves updated capacity settings when form is submitted', async () => {
    const controls = await getControls();
    await fillControlValues(controls, {
      quota: '110 GiB',
      quotaCriticalInherit: false,
      quotaWarning: 50,
      refquota: '',
      refquotaCriticalInherit: true,
      refquotaWarningInherit: true,
      refreservation: '15 GiB',
      reservation: '25 GiB',
    });
    await fillControlValues(controls, {
      quotaCritical: 90,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.update', [
      'root/path',
      {
        quota: 110 * gbs,
        quota_critical: 90,
        quota_warning: 50,
        refquota: 0,
        refquota_warning: inherit,
        refreservation: 15 * gbs,
        reservation: 25 * gbs,
      },
    ]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('only sends updated properties on form submit', async () => {
    const controls = await getControls();
    await fillControlValues(controls, {
      quota: '105 GiB',
      quotaCriticalInherit: false,
      quotaCritical: 93,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith('pool.dataset.update', [
      'root/path',
      {
        quota: 105 * gbs,
        quota_critical: 93,
      },
    ]);
  });
});
