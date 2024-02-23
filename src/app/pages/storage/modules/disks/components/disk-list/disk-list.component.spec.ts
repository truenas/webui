import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { Choices } from 'app/interfaces/choices.interface';
import { Disk, UnusedDisk } from 'app/interfaces/storage.interface';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { DiskListComponent } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.component';
import {
  DiskWipeDialogComponent,
} from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import {
  ManualTestDialogComponent,
} from 'app/pages/storage/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('DiskListComponent', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const fakeDisks = [
    {
      identifier: 'identifier1',
      name: 'sda',
      serial: 'serial1',
      size: 42949672960,
      description: 'description1',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      togglesmart: true,
      smartoptions: '',
      model: 'Virtual_Disk_1',
      rotationrate: null,
      type: 'HDD',
      devname: 'sda',
      pool: 'boot-pool',
    },
    {
      identifier: 'identifier2',
      name: 'sdb',
      serial: 'serial2',
      size: 5368709120,
      description: 'description2',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      togglesmart: false,
      smartoptions: '',
      model: 'Virtual_Disk_2',
      rotationrate: null,
      type: 'SSD',
      devname: 'sdb',
      pool: null,
    },
  ] as Disk[];

  const fakeUnusedDisks = [{
    identifier: 'identifier2',
    name: 'sdb',
    serial: 'serial2',
    size: 5368709120,
    description: 'description2',
    transfermode: 'Auto',
    hddstandby: DiskStandby.AlwaysOn,
    advpowermgmt: DiskPowerLevel.Disabled,
    togglesmart: false,
    smartoptions: '',
    model: 'Virtual_Disk',
    rotationrate: null,
    type: 'HDD',
    exported_zpool: 'test pool',
    devname: 'sdb',
  }] as UnusedDisk[];

  const fakeSmartDiskChoices: Choices = {
    identifier1: 'sda',
  };

  const mockSlideInRef = {
    componentInstance: {
      setFormDisk: jest.fn(),
    },
    slideInClosed$: of(true),
  };

  const createComponent = createComponentFactory({
    component: DiskListComponent,
    imports: [
      IxTable2Module,
      MockModule(PageHeaderModule),
      SearchInput1Component,
    ],
    providers: [
      mockAuth(),
      mockProvider(Router),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => mockSlideInRef),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(),
      }),
      mockWebSocket([
        mockCall('disk.query', fakeDisks),
        mockCall('disk.get_unused', fakeUnusedDisks),
        mockCall('smart.test.disk_choices', fakeSmartDiskChoices),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('shows table rows', async () => {
    const expectedRows = [
      [
        '',
        'Name',
        'Serial',
        'Disk Size',
        'Pool',
      ],
      [
        '',
        'sda',
        'serial1',
        '40 GiB',
        'boot-pool',
      ],
      [
        '',
        'sdb',
        'serial2',
        '5 GiB',
        'test pool (Exported)',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens edit form when Edit button is pressed', async () => {
    const fakeDisk = fakeDisks[0];
    await table.clickToggle(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(DiskFormComponent, { wide: true });
    expect(mockSlideInRef.componentInstance.setFormDisk).toHaveBeenCalledWith(fakeDisk);
  });

  it('shows manual smart test dialog when Manual Test button is pressed', async () => {
    const fakeDisk = fakeDisks[0];
    await table.clickToggle(0);

    const manualTestButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manual Test' }));
    await manualTestButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ManualTestDialogComponent, {
      data: {
        selectedDisks: [fakeDisk],
        diskIdsWithSmart: [fakeDisk.identifier],
      },
    });
  });

  it('redirects to smart results when S.M.A.R.T. Test Results button is pressed', async () => {
    const fakeDisk = fakeDisks[0];
    await table.clickToggle(0);

    const manualTestButton = await loader.getHarness(MatButtonHarness.with({ text: 'S.M.A.R.T. Test Results' }));
    await manualTestButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(
      ['/storage', 'disks', 'smartresults', SmartTestResultPageType.Disk, fakeDisk.name],
    );
  });

  it('shows wipe disk dialog when Wipe button is pressed', async () => {
    const fakeDisk = fakeDisks[1];
    await table.clickToggle(1);

    const manualTestButton = await loader.getHarness(MatButtonHarness.with({ text: 'Wipe' }));
    await manualTestButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DiskWipeDialogComponent, {
      data: {
        diskName: fakeDisk.name,
        exportedPool: fakeUnusedDisks[0].exported_zpool,
      },
    });
  });
});
