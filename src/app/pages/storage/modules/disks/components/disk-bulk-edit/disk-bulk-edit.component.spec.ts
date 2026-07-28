import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnSelectHarness } from '@truenas/ui-components';
import { of, throwError } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import {
  CoreBulkQuery,
  CoreBulkResponse,
} from 'app/interfaces/core-bulk.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskBulkEditComponent } from './disk-bulk-edit.component';

const mockJobSuccessResponse = [
  {
    error: null,
    result: true,
  },
  {
    error: null,
    result: true,
  },
] as CoreBulkResponse[];

describe('DiskBulkEditComponent', () => {
  let spectator: Spectator<DiskBulkEditComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const dataDisk1 = {
    name: 'sda',
    identifier: '{serial}VB76b9dd9d-4e5d8cf2',
    hddstandby: DiskStandby.AlwaysOn,
    advpowermgmt: DiskPowerLevel.Disabled,
  } as Disk;
  const dataDisk2 = {
    name: 'sdc',
    identifier: '{serial}VB5a315293-ea077d3d',
    hddstandby: DiskStandby.Minutes10,
    advpowermgmt: DiskPowerLevel.Level64,
  } as Disk;

  const createComponent = createComponentFactory({
    component: DiskBulkEditComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockAuth(),
      ...ixFormTestingProviders(),
      // The side-panel host otherwise holds a successful submit for the
      // minimum-feedback window before emitting `closed`.
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
      mockProvider(DialogService),
      mockApi([
        mockJob('core.bulk', fakeSuccessfulJob(mockJobSuccessResponse)),
      ]),
    ],
  });

  function getSelect(controlName: string): Promise<TnSelectHarness> {
    return loader.getHarness(TnSelectHarness.with({ selector: `[formControlName="${controlName}"]` }));
  }

  async function fillSettings(): Promise<void> {
    await (await getSelect('hddstandby')).selectOption('10');
    await (await getSelect('advpowermgmt')).selectOption('Level 64 - Intermediate power usage with Standby');
  }

  beforeEach(() => {
    spectator = createComponent({ props: { disksToEdit: [dataDisk1, dataDisk2] } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('sets disks settings when form is opened', async () => {
    const diskNames = spectator.component.form.controls.disknames.value;

    expect(diskNames).toEqual(['sda', 'sdc']);
    expect(await (await getSelect('hddstandby')).getDisplayText()).toBe('Select an option');
    expect(await (await getSelect('advpowermgmt')).getDisplayText()).toBe('Select an option');
    expect(spectator.query('.disk-list').textContent).toContain('sda');
    expect(spectator.query('.disk-list').textContent).toContain('sdc');
  });

  it('updates selected disks when form is submitted', async () => {
    await fillSettings();

    spectator.component.submit();

    const req: CoreBulkQuery = [
      'disk.update',
      [
        [
          '{serial}VB76b9dd9d-4e5d8cf2',
          {
            advpowermgmt: '64',
            hddstandby: '10',
          },
        ],
        [
          '{serial}VB5a315293-ea077d3d',
          {
            advpowermgmt: '64',
            hddstandby: '10',
          },
        ],
      ],
    ];

    expect(api.job).toHaveBeenCalledWith('core.bulk', req);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('emits the disk updates through closed so the opener can reconcile its rows', async () => {
    const closed = jest.fn();
    spectator.component.closed.subscribe(closed);

    await fillSettings();
    spectator.component.submit();

    expect(closed).toHaveBeenCalledWith([
      { identifier: '{serial}VB76b9dd9d-4e5d8cf2', advpowermgmt: '64', hddstandby: '10' },
      { identifier: '{serial}VB5a315293-ea077d3d', advpowermgmt: '64', hddstandby: '10' },
    ]);
  });

  it('opens an error dialog if not all jobs are successful', async () => {
    const dialogService = spectator.inject(DialogService);
    const jobSpy = jest.spyOn(api, 'job');

    jobSpy.mockImplementation((job) => {
      if (job === 'core.bulk') {
        return of(
          fakeSuccessfulJob([
            // first one did not succeed, but the second one did;
            // this should pop an error dialog up to the user.
            { error: 'mock error', result: false },
            { error: null, result: true },
          ]),
        );
      }

      return of(fakeSuccessfulJob(mockJobSuccessResponse));
    });

    await fillSettings();
    spectator.component.submit();

    expect(api.job).toHaveBeenCalledWith('core.bulk', expect.anything());
    expect(dialogService.error).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
  });

  it('handles validation errors on exception', async () => {
    const errorHandler = spectator.inject(FormErrorHandlerService);
    const jobSpy = jest.spyOn(api, 'job');

    jobSpy.mockImplementation((job) => {
      if (job === 'core.bulk') {
        // fake an exception being thrown - no reason to actually mock a response
        // since we're just counting on `handleValidationErrors` to be called
        return throwError(() => new Error());
      }

      return of(fakeSuccessfulJob(mockJobSuccessResponse));
    });

    await fillSettings();
    spectator.component.submit();

    expect(api.job).toHaveBeenCalledWith('core.bulk', expect.anything());
    expect(errorHandler.handleValidationErrors).toHaveBeenCalled();
  });
});
