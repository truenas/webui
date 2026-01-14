import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
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

  const slideInRef: SlideInRef<Disk[] | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => [dataDisk1, dataDisk2]),
  };

  const createComponent = createComponentFactory({
    component: DiskBulkEditComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockApi([
        mockJob('core.bulk', fakeSuccessfulJob(mockJobSuccessResponse)),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    api = spectator.inject(ApiService);
  });

  it('sets disks settings when form is opened', async () => {
    const formValue = await form.getValues();
    const diskIds = spectator.component.diskIds;
    const diskNames = spectator.component.form.controls.disknames.value;

    expect(formValue).toEqual({
      'HDD Standby': '',
      'Advanced Power Management': '',
    });
    expect(diskNames).toEqual(['sda', 'sdc']);
    expect(diskIds).toEqual(['{serial}VB76b9dd9d-4e5d8cf2', '{serial}VB5a315293-ea077d3d']);
  });

  it('updates selected disks when form is submitted', async () => {
    spectator.component.diskIds = [
      '{serial}VB76b9dd9d-4e5d8cf2',
      '{serial}VBd494d425-607efd80',
    ];

    const changeValue = {
      'HDD Standby': '10',
      'Advanced Power Management': 'Level 64 - Intermediate power usage with Standby',
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
          },
        ],
        [
          '{serial}VBd494d425-607efd80',
          {
            advpowermgmt: '64',
            hddstandby: '10',
          },
        ],
      ],
    ];

    expect(api.job).toHaveBeenCalledWith('core.bulk', req);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('opens an error dialog if not all jobs are successful', async () => {
    const dialogService = spectator.inject(DialogService);
    const jobSpy = jest.spyOn(api, 'job');

    jobSpy.mockImplementation((job) => {
      if (job === 'core.bulk') {
        return of(fakeSuccessfulJob([
          // first one did not succeed, but the second one did;
          // this should pop an error dialog up to the user.
          { error: 'mock error', result: false },
          { error: null, result: true },
        ]));
      }

      return of(fakeSuccessfulJob(mockJobSuccessResponse));
    });

    spectator.component.diskIds = [
      '{serial}VB76b9dd9d-4e5d8cf2',
      '{serial}VBd494d425-607efd80',
    ];

    const changeValue = {
      'HDD Standby': '10',
      'Advanced Power Management': 'Level 64 - Intermediate power usage with Standby',
    };
    await form.fillForm(changeValue);
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('core.bulk', expect.anything());
    expect(dialogService.error).toHaveBeenCalled();
  });

  it('closes the slidein and handles validation errors on exception', async () => {
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

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('core.bulk', expect.anything());
    expect(slideInRef.close).toHaveBeenCalled();
    expect(errorHandler.handleValidationErrors).toHaveBeenCalled();
  });
});
