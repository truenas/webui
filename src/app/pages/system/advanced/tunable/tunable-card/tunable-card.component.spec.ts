import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnButtonHarness, TnMenuHarness, TnTableHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedJob, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { ConfirmDeleteJobOptions } from 'app/interfaces/dialog.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { openRowActionsMenu } from 'app/modules/tn-table/testing/table-row-actions.utils';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { TunableCardComponent } from './tunable-card.component';

describe('TunableCardComponent', () => {
  let spectator: Spectator<TunableCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

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
    providers: [
      mockTypedApi([
        mockTypedQuery('tunable.query', items as unknown as WebUiQueryEntity<'tunable.query'>[]),
        mockTypedJob('tunable.delete', { state: JobState.Success }),
        mockTypedJob('tunable.create', { state: JobState.Success }),
        mockTypedJob('tunable.update', { state: JobState.Success }),
        mockTypedCall('tunable.tunable_type_choices', {
          SYSCTL: 'SYSCTL',
          UDEV: 'UDEV',
        } as unknown as CallResponse<WebUiApiDirectory, 'tunable.tunable_type_choices'>),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteJobOptions) => options.job()),
      }),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => ({ success$: of(true) })),
      }),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(undefined)),
      }),
      mockAuth(),
    ],
  });

  function openFirstRowMenu(): Promise<TnMenuHarness> {
    return openRowActionsMenu(spectator.fixture);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Var', 'Value', 'Enabled', 'Description', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['zfs_arc_max', '1073741824', 'Yes', 'Max ZFS ARC size', ''],
      ['vfs.zfs.arc_min', '10000000', 'Yes', 'Min ZFS ARC size', ''],
    ]);
  });

  it('tags each row by variable, not by the value that editing it changes', () => {
    expect(spectator.query('tbody tr[data-test]')).toHaveAttribute('data-test', 'row-tunable-zfs-arc-max');
  });

  it('links its title to the full Tunable list', () => {
    const link = spectator.query<HTMLAnchorElement>('h3 a');
    expect(link).toHaveText('Tunable');
    expect(link).toHaveAttribute('href', '/system/tunable');
  });

  it('opens the Add Tunable form in a side panel when Add is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'Add Tunable', editData: undefined },
    );
  });

  it('opens the Edit Tunable form in the side panel with the selected row', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(
      expect.anything(),
      { title: 'Edit Tunable (ZFS)', editData: expect.objectContaining(items[0]) },
    );
  });

  it('deletes a tunable variable with confirmation when Delete button is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete Tunable (ZFS)',
      message: 'Are you sure you want to delete "zfs_arc_max"?',
      job: expect.any(Function),
      jobProgressTitle: 'Deleting...',
      successMessage: 'Variable deleted.',
    });

    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('tunable.delete', [1]);
  });
});
