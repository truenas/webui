import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk, DetailsDisk } from 'app/interfaces/disk.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  DiskBulkEditComponent,
} from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { DiskListComponent } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.component';
import {
  ResetSedDialog,
} from 'app/pages/storage/modules/disks/components/disk-list/reset-sed-dialog/reset-sed-dialog.component';
import {
  UnlockSedDialog,
} from 'app/pages/storage/modules/disks/components/disk-list/unlock-sed-dialog/unlock-sed-dialog.component';
import {
  DiskWipeDialog,
} from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import { LicenseService } from 'app/services/license.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('DiskListComponent', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
      model: 'Virtual_Disk_2',
      rotationrate: null,
      type: 'SSD',
      devname: 'sdb',
      pool: null,
    },
    {
      identifier: 'identifier3',
      name: 'sdc',
      serial: 'serial3',
      size: 5368709120,
      description: 'description3',
      transfermode: 'Auto',
      hddstandby: 'ALWAYS ON',
      advpowermgmt: 'DISABLED',
      model: 'Virtual_Disk_3',
      rotationrate: null,
      type: 'HDD',
      devname: 'sdc',
      pool: null,
      sed: true,
      sed_status: SedStatus.Locked,
    },
  ] as Disk[];

  const fakeUnusedDisks = [{
    identifier: 'identifier2',
    name: 'sdb',
    serial: 'serial2',
    size: 5368709120,
    model: 'Virtual_Disk',
    rotationrate: null,
    type: 'HDD',
    exported_zpool: 'test pool',
    devname: 'sdb',
  }] as DetailsDisk[];

  const createComponent = createComponentFactory({
    component: DiskListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      IxTableColumnsSelectorComponent,
      IxTableDetailsRowDirective,
      IxTableDetailsRowComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(Router),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of(true)),
        })),
      }),
      mockProvider(LicenseService, {
        hasSed$: of(true),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
      mockApi([
        mockCall('disk.query', fakeDisks),
        mockCall('disk.details', { unused: [], used: fakeUnusedDisks }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows table rows', async () => {
    const expectedRows = [
      [
        '',
        'Name',
        'Serial',
        'Disk Size',
        'Pool',
        'Self-Encrypting Drive (SED)',
      ],
      [
        '',
        'sda',
        'serial1',
        '40 GiB',
        'boot-pool',
        'Unsupported',
      ],
      [
        '',
        'sdb',
        'serial2',
        '5 GiB',
        'test pool (Exported)',
        'Unsupported',
      ],
      [
        '',
        'sdc',
        'serial3',
        '5 GiB',
        'N/A',
        'Locked',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens edit form when Edit button is pressed', async () => {
    const fakeDisk = fakeDisks[0];
    await table.expandRow(0);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(DiskFormComponent, { data: fakeDisk });
  });

  it('shows wipe disk dialog when Wipe button is pressed', async () => {
    const fakeDisk = fakeDisks[1];
    await table.expandRow(1);

    const manualTestButton = await loader.getHarness(MatButtonHarness.with({ text: 'Wipe' }));
    await manualTestButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DiskWipeDialog, {
      data: {
        diskName: fakeDisk.name,
        exportedPool: fakeUnusedDisks[0].exported_zpool,
      },
    });
  });

  it('opens bulk edit form when multiple disks are selected and Edit is pressed', async () => {
    await table.selectRows([0, 1]);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit Disks' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      DiskBulkEditComponent,
      {
        data: [
          expect.objectContaining({
            name: 'sda',
          }),
          expect.objectContaining({
            name: 'sdb',
          }),
        ],
      },
    );
  });

  it('shows unlock SED dialog when Unlock button is pressed for locked SED disk', async () => {
    await table.expandRow(2);

    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock' }));
    await unlockButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(UnlockSedDialog, {
      data: { diskName: 'sdc' },
    });
  });

  it('shows reset SED dialog when SED Reset button is pressed for locked SED disk', async () => {
    await table.expandRow(2);

    const resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'SED Reset' }));
    await resetButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ResetSedDialog, {
      data: { diskName: 'sdc' },
    });
  });
});

describe('DiskListComponent - without SED license', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const fakeDisks = [
    {
      identifier: 'identifier1',
      name: 'sda',
      serial: 'serial1',
      size: 42949672960,
      pool: 'boot-pool',
    },
  ] as Disk[];

  const createComponent = createComponentFactory({
    component: DiskListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
      IxTableColumnsSelectorComponent,
      IxTableDetailsRowDirective,
      IxTableDetailsRowComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(Router),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(MatDialog),
      mockProvider(LicenseService, {
        hasSed$: of(false),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
      mockApi([
        mockCall('disk.query', fakeDisks),
        mockCall('disk.details', { unused: [], used: [] }),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('hides SED column when hasSed$ is false', async () => {
    const cells = await table.getCellTexts();
    const headerRow = cells[0];

    expect(headerRow).not.toContain('Self-Encrypting Drive (SED)');
    expect(headerRow).toEqual(['', 'Name', 'Serial', 'Disk Size', 'Pool']);
  });
});
