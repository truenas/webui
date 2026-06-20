import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ConfirmDeleteJobOptions } from 'app/interfaces/dialog.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { TunableFormComponent } from 'app/pages/system/advanced/tunable/tunable-form/tunable-form.component';
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
      mockApi([
        mockCall('tunable.query', items),
        mockJob('tunable.delete', fakeSuccessfulJob()),
        mockJob('tunable.create', fakeSuccessfulJob()),
        mockJob('tunable.update', fakeSuccessfulJob()),
        mockCall('tunable.tunable_type_choices', {
          SYSCTL: 'SYSCTL',
          UDEV: 'UDEV',
        }),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteJobOptions) => options.job()),
      }),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  async function openFirstRowMenu(): Promise<TnMenuHarness> {
    spectator.click(spectator.query('[data-test$="more-action"]') as HTMLElement);
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
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

  it('opens the Add Tunable form in a side panel when Add is pressed', async () => {
    expect(spectator.query('ix-tunable-form')).toBeNull();

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.query('ix-tunable-form')).not.toBeNull();
  });

  it('closes the side panel when the hosted form emits closed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();
    expect(spectator.query('ix-tunable-form')).not.toBeNull();

    spectator.query(TunableFormComponent).closed.emit(true);
    spectator.detectChanges();

    expect(spectator.query('ix-tunable-form')).toBeNull();
  });

  it('opens the Edit Tunable form in the side panel with the selected row', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Edit' });
    spectator.detectChanges();

    const form = spectator.query(TunableFormComponent);
    expect(form).not.toBeNull();
    expect(form.editTunable()).toEqual(items[0]);
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

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('tunable.delete', [1]);
  });
});
