import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { GiB } from 'app/constants/bytes.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { fillControlValues, getControlValues } from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  DatasetCapacitySettingsComponent,
} from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-settings/dataset-capacity-settings.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DatasetCapacitySettingsComponent', () => {
  let spectator: Spectator<DatasetCapacitySettingsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DatasetCapacitySettingsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('pool.dataset.update'),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockProvider(SlideInService),
      mockProvider(SlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      providers: [
        {
          provide: SLIDE_IN_DATA,
          useValue: {
            id: 'root/path',
            name: 'root/path',
            refquota: { parsed: 50 * GiB },
            refquota_warning: { parsed: 50, source: ZfsPropertySource.Local },
            refquota_critical: { parsed: 0, source: ZfsPropertySource.Default },
            quota: { parsed: 100 * GiB },
            quota_warning: { parsed: null, source: ZfsPropertySource.Local },
            quota_critical: { parsed: 0, source: ZfsPropertySource.Inherited },
            refreservation: { parsed: 10 * GiB },
            reservation: { parsed: 20 * GiB },
          } as DatasetDetails,
        },
      ],
    });
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
    await controls.quotaWarningInherit.setValue(true);
    expect(await controls.quotaWarning.isDisabled()).toBe(true);
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
        quota: 105 * GiB,
        quota_critical: 93,
      },
    ]);
  });
});
