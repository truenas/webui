import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { RebootRequiredDialog } from 'app/modules/dialog/components/reboot-required-dialog/reboot-required-dialog.component';
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
          {
            selector: selectHaStatus,
            value: {
              reasons: [
                FailoverDisabledReason.MismatchNics,
                'NEW_UNMAPPED_REASON' as FailoverDisabledReason,
              ],
            },
          },
        ],
      }),
      mockProvider(RebootService, {
        restart: jest.fn(),
        restartRemote: jest.fn(() => of(undefined)),
      }),
      mockProvider(DialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows failover warning when failover is unhealthy', () => {
    expect(spectator.query('.dialog-message.error')).toHaveText(
      'Reboot will cause a failover event which may trigger temporary outages of services.',
    );

    expect(spectator.queryAll('.failover-reasons li').map((item) => item.textContent!.trim()))
      .toContain('Network interfaces do not match between storage controllers.');
  });

  it('falls back to the raw reason when there is no label for it', () => {
    expect(spectator.queryAll('.failover-reasons li').map((item) => item.textContent!.trim()))
      .toContain('NEW_UNMAPPED_REASON');
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
    const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const rebootRemoteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Reboot Standby Controller' }));
    await rebootRemoteButton.click();

    expect(spectator.inject(RebootService).restartRemote).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
  });

  it('reboots local node with translated reason when Reboot Active Controller is pressed', async () => {
    const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const rebootLocalButton = await loader.getHarness(TnButtonHarness.with({ label: 'Reboot Active Controller' }));
    await rebootLocalButton.click();

    expect(spectator.inject(RebootService).restart).toHaveBeenCalledWith('Active Controller Update Reboot');
  });
});
