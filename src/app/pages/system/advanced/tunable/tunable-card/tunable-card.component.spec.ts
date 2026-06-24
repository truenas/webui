import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ConfirmDeleteJobOptions } from 'app/interfaces/dialog.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { TunableCardComponent } from './tunable-card.component';

describe('TunableCardComponent', () => {
  let spectator: Spectator<TunableCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const items = [
    {
      id: 1,
      type: 'ZFS',
      var: 'zfs_arc_max',
      comment: 'Max ZFS ARC size',
      enabled: true,
      value: '1073741824',
    },
    {
      id: 2,
      type: 'ZFS',
      var: 'vfs.zfs.arc_min',
      comment: 'Min ZFS ARC size',
      enabled: true,
      value: '10000000',
    },
  ] as Tunable[];

  const createComponent = createComponentFactory({
    component: TunableCardComponent,
    imports: [
    ],
    providers: [
      mockApi([
        mockCall('tunable.query', items),
        mockJob('tunable.delete', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteJobOptions) => options.job()),
      }),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => Promise.resolve()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Var', 'Value', 'Enabled', 'Description', ''],
      [
        'zfs_arc_max',
        '1073741824',
        'Yes',
        'Max ZFS ARC size',
        '',
      ],
      [
        'vfs.zfs.arc_min',
        '10000000',
        'Yes',
        'Min ZFS ARC size',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit a tunable variable when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(TnIconHarness.with({ name: 'mdi-pencil' }), 1, 4);
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'Edit Tunable (ZFS)', editData: expect.objectContaining(items[0]) },
    );
  });

  it('deletes a tunable variable with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(TnIconHarness.with({ name: 'mdi-delete' }), 1, 4);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete Tunable (ZFS)',
      message: 'Are you sure you want to delete "zfs_arc_max"?',
      job: expect.any(Function),
      jobProgressTitle: 'Deleting...',
      successMessage: 'Variable deleted.',
    });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('tunable.delete', [1]);
  });
});
