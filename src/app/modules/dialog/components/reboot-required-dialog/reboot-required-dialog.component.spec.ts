import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { SystemRebootInfo } from 'app/interfaces/reboot-info.interface';
import { RebootRequiredDialogComponent } from 'app/modules/dialog/components/reboot-required-dialog/reboot-required-dialog.component';
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
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows reasons', () => {
    expect(
      spectator.queryAll('.reasons li').map((item) => item.textContent.trim()),
    ).toEqual([
      'Test Reason 1',
      'Test Reason 2',
      'Test Reason 3',
      'Test Reason 4',
    ]);
  });
});
