import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  mockWebSocket, mockCall, mockJob,
} from 'app/core/testing/utils/mock-websocket.utils';
import { Tunable } from 'app/interfaces/tunable.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { TunableListComponent } from 'app/pages/system/advanced/sysctl/tunable-list/tunable-list.component';
import { DialogService } from 'app/services/dialog.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

describe('TunableListComponent', () => {
  let spectator: Spectator<TunableListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const tunables = [
    {
      id: 1,
      type: 'ZFS',
      var: 'zfs_dirty_data_max_max',
      value: '12884901888',
      orig_value: '4294967296',
      comment: 'Generated by autotune',
      enabled: true,
    },
    {
      id: 2,
      type: 'ZFS',
      var: 'zfs_arc_max',
      value: '121227934924',
      orig_value: '0',
      comment: 'Generated by autotune',
      enabled: true,
    },
    {
      id: 3,
      type: 'ZFS',
      var: 'l2arc_noprefetch',
      value: '0',
      orig_value: '1',
      comment: 'Generated by autotune',
      enabled: true,
    },
    {
      id: 4,
      type: 'ZFS',
      var: 'l2arc_write_max',
      value: '10000000',
      orig_value: '8388608',
      comment: 'Generated by autotune',
      enabled: true,
    },
    {
      id: 5,
      type: 'ZFS',
      var: 'l2arc_write_boost',
      value: '40000000',
      orig_value: '8388608',
      comment: 'Generated by autotune',
      enabled: true,
    },
    {
      id: 6,
      type: 'ZFS',
      var: 'zfs_vdev_sync_write_max_active',
      value: '67108864',
      orig_value: '10',
      comment: 'Generated by autotune',
      enabled: true,
    },
    {
      id: 12,
      type: 'SYSCTL',
      var: 'kernel.hostname',
      value: 'truenas',
      orig_value: 'truenas',
      comment: 'Description text',
      enabled: true,
    },
    {
      id: 13,
      type: 'SYSCTL',
      var: 'kernel.watchdog',
      value: '1',
      orig_value: '1',
      comment: 'Woof woof',
      enabled: true,
    },
  ] as Tunable[];

  const createComponent = createComponentFactory({
    component: TunableListComponent,
    imports: [IxTable2Module],
    declarations: [],
    providers: [
      mockProvider(IxChainedSlideInService, {
        pushComponent: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockWebSocket([
        mockCall('core.get_jobs'),
        mockCall('tunable.query', tunables),
        mockJob('tunable.delete', fakeSuccessfulJob()),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Variable', 'Value', 'Type', 'Description', 'Enabled', ''],
      ['kernel.hostname', 'truenas', 'SYSCTL', 'Description text', 'Yes', ''],
      ['kernel.watchdog', '1', 'SYSCTL', 'Woof woof', 'Yes', ''],
      ['l2arc_noprefetch', '0', 'ZFS', 'Generated by autotune', 'Yes', ''],
      ['l2arc_write_boost', '40000000', 'ZFS', 'Generated by autotune', 'Yes', ''],
      ['l2arc_write_max', '10000000', 'ZFS', 'Generated by autotune', 'Yes', ''],
      ['zfs_arc_max', '121227934924', 'ZFS', 'Generated by autotune', 'Yes', ''],
      ['zfs_dirty_data_max_max', '12884901888', 'ZFS', 'Generated by autotune', 'Yes', ''],
      ['zfs_vdev_sync_write_max_active', '67108864', 'ZFS', 'Generated by autotune', 'Yes', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it.skip('shows add form when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxChainedSlideInService).pushComponent).toHaveBeenCalledWith(TunableFormComponent, {});
  });

  it('shows edit form with an existing sysctl when Edit button is pressed', async () => {
    const editIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editIcon.click();

    expect(spectator.inject(IxChainedSlideInService).pushComponent).toHaveBeenCalledWith(
      TunableFormComponent,
      false,
      {
        comment: 'Description text',
        enabled: true,
        id: 12,
        orig_value: 'truenas',
        type: 'SYSCTL',
        value: 'truenas',
        var: 'kernel.hostname',
      },
    );
  });

  it('shows confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      buttonText: 'Delete',
      message: 'Are you sure you want to delete "kernel.hostname"?',
      title: 'Delete Sysctl',
    });
  });
});
