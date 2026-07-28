import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnDialog, TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { Disk, DetailsDisk } from 'app/interfaces/disk.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import {
  IxTableDetailsRowComponent,
} from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import {
  TableColumnPickerComponent,
} from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DiskBulkEditComponent,
} from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent, DiskFormResponse } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
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
  let table: TnTableHarness;

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
      TableColumnPickerComponent,
      IxTableDetailsRowComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
          close: jest.fn(),
        }) as unknown as DialogRef),
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
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual([
      'Name',
      'Serial',
      'Disk Size',
      'Pool',
      'Self-Encrypting Drive (SED)',
    ]);

    expect(await table.getAllRowTexts()).toEqual([
      ['sda', 'serial1', '40 GiB', 'boot-pool', 'Unsupported'],
      ['sdb', 'serial2', '5 GiB', 'test pool (Exported)', 'Unsupported'],
      ['sdc', 'serial3', '5 GiB', 'N/A', 'Locked'],
    ]);
  });

  it('keeps the legacy row-action test ids after moving to tn-button', async () => {
    await table.toggleRowExpansion(2);

    expect(spectator.query('[data-test="button-sdc-edit"]')).toExist();
    expect(spectator.query('[data-test="button-sdc-unlock"]')).toExist();
    expect(spectator.query('[data-test="button-sdc-reset-sed"]')).toExist();
    expect(spectator.query('[data-test="button-edit-selected"]')).not.toExist();
  });

  it('opens edit form when Edit button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(DiskFormComponent, {
      title: 'Edit Disk',
      inputs: { diskToEdit: expect.objectContaining({ name: 'sda' }) },
    });
  });

  it('shows wipe disk dialog when Wipe button is pressed', async () => {
    const fakeDisk = fakeDisks[1];
    await table.toggleRowExpansion(1);

    const wipeButton = await loader.getHarness(TnButtonHarness.with({ label: 'Wipe' }));
    await wipeButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DiskWipeDialog, {
      data: {
        diskName: fakeDisk.name,
        exportedPool: fakeUnusedDisks[0].exported_zpool,
      },
    });
  });

  it('opens bulk edit form when multiple disks are selected and Edit is pressed', async () => {
    await table.toggleRowSelection(0);
    await table.toggleRowSelection(1);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit Disks' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      DiskBulkEditComponent,
      {
        title: 'Bulk Edit Disks',
        inputs: {
          disksToEdit: [
            expect.objectContaining({ name: 'sda' }),
            expect.objectContaining({ name: 'sdb' }),
          ],
        },
      },
    );
  });

  it('shows unlock SED dialog when Unlock button is pressed for locked SED disk', async () => {
    await table.toggleRowExpansion(2);

    const unlockButton = await loader.getHarness(TnButtonHarness.with({ label: 'Unlock' }));
    await unlockButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(UnlockSedDialog, {
      data: { diskName: 'sdc' },
    });
  });

  it('shows reset SED dialog when SED Reset button is pressed for locked SED disk', async () => {
    await table.toggleRowExpansion(2);

    const resetButton = await loader.getHarness(TnButtonHarness.with({ label: 'SED Reset' }));
    await resetButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ResetSedDialog, {
      data: { diskName: 'sdc' },
    });
  });

  it('updates disks when edit form is saved', async () => {
    const api = spectator.inject(ApiService);
    const formPanel = spectator.inject(FormSidePanelService);

    const mockUpd: DiskFormResponse = [{ identifier: 'identifier1', description: 'updated' }];
    jest.spyOn(formPanel, 'open').mockReturnValue(SlideInResult.success(mockUpd));

    await table.toggleRowExpansion(0);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    spectator.detectChanges();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenCalledWith('disk.query', expect.anything());
    expect(api.call).toHaveBeenCalledWith('disk.details');
    expect(await table.getCellText(0, 'serial')).toBe('serial1');
  });
});

describe('DiskListComponent - without SED license', () => {
  let spectator: Spectator<DiskListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

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
      TableColumnPickerComponent,
      IxTableDetailsRowComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog),
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
    table = await loader.getHarness(TnTableHarness);
  });

  it('hides SED column when hasSed$ is false', async () => {
    const headerRow = await table.getHeaderTexts();

    expect(headerRow).not.toContain('Self-Encrypting Drive (SED)');
    expect(headerRow).toEqual(['Name', 'Serial', 'Disk Size', 'Pool']);
  });
});
