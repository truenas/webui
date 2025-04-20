import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { RebootRequiredDialog } from 'app/modules/dialog/components/reboot-required-dialog/reboot-required-dialog.component';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { RebootService } from 'app/services/reboot.service';
import { selectCanFailover, selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectOtherNodeRebootInfo,
  selectThisNodeRebootInfo,
} from 'app/store/reboot-info/reboot-info.selectors';

const fakeThisNodeRebootInfo: SystemRebootInfo = {
  boot_id: 'this-boot-id',
  reboot_required_reasons: [
    { code: 'FIPS', reason: 'Test Reason 1' },
    { code: 'FIPS', reason: 'Test Reason 2' },
  ],
};

const fakeOtherNodeRebootInfo: SystemRebootInfo = {
  boot_id: 'other-boot-id',
  reboot_required_reasons: [
    { code: 'FIPS', reason: 'Test Reason 3' },
    { code: 'FIPS', reason: 'Test Reason 4' },
  ],
};

describe('RebootRequiredDialogComponent', () => {
  let spectator: Spectator<RebootRequiredDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: RebootRequiredDialog,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectThisNodeRebootInfo,
            value: fakeThisNodeRebootInfo,
          },
          {
            selector: selectOtherNodeRebootInfo,
            value: fakeOtherNodeRebootInfo,
          },
          { selector: selectIsHaLicensed, value: true },
          { selector: selectCanFailover, value: false },
          { selector: selectHaStatus, value: { reasons: [FailoverDisabledReason.MismatchNics] } },
        ],
      }),
      mockProvider(RebootService, {
        restartRemote: jest.fn(() => of(undefined)),
      }),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows failover warning when failover is unhealthy', () => {
    expect(spectator.query('.dialog-message.error')).toHaveText(
      'Failover is unhealthy. Rebooting now will cause a production outage.',
    );

    expect(spectator.queryAll('.failover-reasons li').map((item) => item.textContent!.trim()))
      .toContain('Network interfaces do not match between storage controllers.');
  });

  it('shows reasons why reboot is required', () => {
    expect(
      spectator.queryAll('.reasons li').map((item) => item.textContent!.trim()),
    ).toEqual([
      'Test Reason 1',
      'Test Reason 2',
      'Test Reason 3',
      'Test Reason 4',
    ]);
  });

  it('reboots another node and closes dialog when Reboot Standby Controller is pressed', async () => {
    const confirmCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.setValue(true);

    const rebootRemoteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Reboot Standby Controller' }));
    await rebootRemoteButton.click();

    expect(spectator.inject(RebootService).restartRemote).toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
