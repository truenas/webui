import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { DiskBulkEditComponent } from './disk-bulk-edit.component';

const mockJobSuccessResponse = [{
  error: null,
  result: true,
}, {
  error: null,
  result: true,
}] as CoreBulkResponse[];

describe('DiskBulkEditComponent', () => {
  let spectator: Spectator<DiskBulkEditComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let ws: WebSocketService;
  const dataDisk1 = {
    name: 'sda',
    identifier: '{serial}VB76b9dd9d-4e5d8cf2',
    hddstandby: DiskStandby.AlwaysOn,
    advpowermgmt: DiskPowerLevel.Disabled,
    togglesmart: false,
    smartoptions: '',
  } as Disk;
  const dataDisk2 = {
    name: 'sdc',
    identifier: '{serial}VB5a315293-ea077d3d',
    hddstandby: DiskStandby.Minutes10,
    advpowermgmt: DiskPowerLevel.Level64,
    togglesmart: true,
    smartoptions: '/dev/hd[at], /dev/sd[az]',
  } as Disk;
  const createComponent = createComponentFactory({
    component: DiskBulkEditComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      TooltipModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockWebsocket([
        mockJob('core.bulk', fakeSuccessfulJob(mockJobSuccessResponse)),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    ws = spectator.inject(WebSocketService);
  });

  it('it sets disks settings when form is opened', async () => {
    spectator.component.setFormDiskBulk([dataDisk1, dataDisk2]);
    const formValue = await form.getValues();
    const diskIds = spectator.component.diskIds;
    expect(formValue).toEqual({
      'Disks to be edited:': ['sda', 'sdc'],
      'HDD Standby': '',
      'Advanced Power Management': '',
      'Enable S.M.A.R.T.': true,
      'S.M.A.R.T. Extra Options': '/dev/hd[at], /dev/sd[az]',
    });
    expect(diskIds).toEqual(['{serial}VB76b9dd9d-4e5d8cf2', '{serial}VB5a315293-ea077d3d']);
  });

  it('it update selected disks when form is submitted', async () => {
    spectator.component.diskIds = [
      '{serial}VB76b9dd9d-4e5d8cf2',
      '{serial}VBd494d425-607efd80',
    ];

    const changeValue = {
      'HDD Standby': '10',
      'Advanced Power Management': 'Level 64 - Intermediate power usage with Standby',
      'Enable S.M.A.R.T.': true,
      'S.M.A.R.T. Extra Options': 'new smart options',
    };
    await form.fillForm(changeValue);
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    const req: CoreBulkQuery = [
      'disk.update',
      [
        [
          '{serial}VB76b9dd9d-4e5d8cf2',
          {
            advpowermgmt: '64',
            hddstandby: '10',
            smartoptions: 'new smart options',
            togglesmart: true,
          },
        ],
        [
          '{serial}VBd494d425-607efd80',
          {
            advpowermgmt: '64',
            hddstandby: '10',
            smartoptions: 'new smart options',
            togglesmart: true,
          },
        ],
      ],
    ];

    expect(ws.job).toHaveBeenCalledWith('core.bulk', req);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });
});
