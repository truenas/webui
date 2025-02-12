import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { RebootRequiredDialogComponent } from 'app/modules/dialog/components/reboot-required-dialog/reboot-required-dialog.component';
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
  let spectator: Spectator<RebootRequiredDialogComponent>;

  const createComponent = createComponentFactory({
    component: RebootRequiredDialogComponent,
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
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows failover warning when failover is unhealthy', () => {
    expect(spectator.query('.dialog-message.error')).toHaveText(
      'Failover is unhealthy. Rebooting now will cause a production outage.',
    );

    expect(spectator.queryAll('.failover-reasons li').map((item) => item.textContent!.trim()))
      .toContain('Network interfaces do not match between storage controllers.');
  });

  it('shows reasons', () => {
    expect(
      spectator.queryAll('.reasons li').map((item) => item.textContent!.trim()),
    ).toEqual([
      'Test Reason 1',
      'Test Reason 2',
      'Test Reason 3',
      'Test Reason 4',
    ]);
  });
});
