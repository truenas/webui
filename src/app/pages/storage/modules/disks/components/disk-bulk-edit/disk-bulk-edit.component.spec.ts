import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnSelectHarness } from '@truenas/ui-components';
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
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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

  const slideInRef: SlideInRef<Disk[] | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => [dataDisk1, dataDisk2]),
  };

  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  /** Fills both selects with the values every save test submits. */
  const fillForm = async (): Promise<void> => {
    await (await getSelect('hddstandby')).selectOption('10');
    await (await getSelect('advpowermgmt')).selectOption('Level 64 - Intermediate power usage with Standby');
  };

  const createComponent = createComponentFactory({
    component: DiskBulkEditComponent,
    imports: [ReactiveFormsModule],
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
    api = spectator.inject(ApiService);
    await spectator.fixture.whenStable();
  });

  it('sets disks settings when form is opened', async () => {
    // The two disks disagree on both settings, so each select opens unset.
    expect(await (await getSelect('hddstandby')).getDisplayText()).toBe('Select an option');
    expect(await (await getSelect('advpowermgmt')).getDisplayText()).toBe('Select an option');

    const diskNames = spectator.queryAll('[role="listitem"]').map((el) => el.textContent.trim());
    expect(diskNames).toEqual(['sda', 'sdc']);
  });

  it('updates selected disks when form is submitted', async () => {
    await fillForm();

    const saveButton = await loader.getHarness(
      TnButtonHarness.with({ label: 'Save' }),
    );
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
          '{serial}VB5a315293-ea077d3d',
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

    await fillForm();

    const saveButton = await loader.getHarness(
      TnButtonHarness.with({ label: 'Save' }),
    );
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('core.bulk', expect.anything());
    expect(dialogService.error).toHaveBeenCalled();
  });

  it('closes the slide-in and handles validation errors on exception', async () => {
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

    const saveButton = await loader.getHarness(
      TnButtonHarness.with({ label: 'Save' }),
    );
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('core.bulk', expect.anything());
    expect(slideInRef.close).toHaveBeenCalled();
    expect(errorHandler.handleValidationErrors).toHaveBeenCalled();
  });
});

// The only production caller is disk-list, which opens this form through FormSidePanelService
// — a host that provides no SlideInRef. The suite above covers the legacy SlideIn host; this
// one covers the path the page actually takes.
describe('DiskBulkEditComponent - side panel host (no SlideInRef)', () => {
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
      { provide: SlideInRef, useValue: null },
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockApi([
        mockJob('core.bulk', fakeSuccessfulJob(mockJobSuccessResponse)),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({ props: { disksToEdit: [dataDisk1, dataDisk2] } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    await spectator.fixture.whenStable();
  });

  it('renders no in-form Save button, leaving it to the panel footer', async () => {
    expect(await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Save' }))).toBeNull();
  });

  it('resolves disks from the disksToEdit input and emits closed when saved', async () => {
    const closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);

    const diskNames = spectator.queryAll('[role="listitem"]').map((el) => el.textContent.trim());
    expect(diskNames).toEqual(['sda', 'sdc']);

    const hddstandby = await loader.getHarness(
      TnSelectHarness.with({ selector: '[formControlName="hddstandby"]' }),
    );
    await hddstandby.selectOption('10');

    const advpowermgmt = await loader.getHarness(
      TnSelectHarness.with({ selector: '[formControlName="advpowermgmt"]' }),
    );
    await advpowermgmt.selectOption('Level 64 - Intermediate power usage with Standby');

    expect(spectator.component.canSubmit()).toBe(true);
    spectator.component.submit();

    expect(api.job).toHaveBeenCalledWith('core.bulk', expect.anything());
    expect(closedSpy).toHaveBeenCalledWith([
      expect.objectContaining({ identifier: '{serial}VB76b9dd9d-4e5d8cf2' }),
      expect.objectContaining({ identifier: '{serial}VB5a315293-ea077d3d' }),
    ]);
  });
});
