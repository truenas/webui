import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnAutocompleteHarness, TnButtonHarness, TnInputHarness, TnRadioGroupHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  mockSedDiskPasswordCalls, sedEntitledProvider,
} from 'app/pages/storage/modules/vdevs/components/sed-disk-password/testing/sed-disk-password-mocks';
import {
  ExtendDialog, ExtendDialogParams,
} from 'app/pages/storage/modules/vdevs/components/zfs-info-card/extend-dialog/extend-dialog.component';
import { PoolExtendJobService } from 'app/pages/storage/modules/vdevs/services/pool-extend-job.service';

describe('ExtendDialogComponent', () => {
  let spectator: Spectator<ExtendDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExtendDialog,
    imports: [
      ReactiveFormsModule,
      UnusedDiskSelectComponent,
    ],
    providers: [
      mockAuth(),
      sedEntitledProvider,
      mockTypedApi([
        mockTypedCall('disk.details', {
          unused: [
            {
              devname: 'sde',
              name: 'sde',
              size: 12000138625024,
              duplicate_serial: [],
            },
            {
              devname: 'sdf',
              name: 'sdf',
              size: 10000138625024,
              duplicate_serial: [
                'sdf',
              ],
            },
          ] as DetailsDisk[],
          used: [],
        }),
        ...mockSedDiskPasswordCalls(),
      ]),
      mockApi([
        mockJob('pool.attach', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogRef),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(PoolExtendJobService, {
        checkForExistingExtendJob: jest.fn(() => of(false)),
      }),
      {
        provide: DIALOG_DATA,
        useValue: {
          poolId: 4,
          targetVdevGuid: 'vdev-guid',
        } as ExtendDialogParams,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('extends a vdev when new unused disk is selected', async () => {
    const disk = await loader.getHarness(TnAutocompleteHarness);
    await disk.selectOption('sde (10.91 TiB)');

    const extendButton = await loader.getHarness(TnButtonHarness.with({ label: 'Extend' }));
    await extendButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.attach', [
      4,
      {
        new_disk: 'sde',
        target_vdev: 'vdev-guid',
        allow_duplicate_serials: true,
      },
    ]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('shows error when extend job is already running for this pool', async () => {
    const poolExtendJobService = spectator.inject(PoolExtendJobService);
    jest.spyOn(poolExtendJobService, 'checkForExistingExtendJob').mockReturnValue(of(true));

    const disk = await loader.getHarness(TnAutocompleteHarness);
    await disk.selectOption('sde (10.91 TiB)');

    const extendButton = await loader.getHarness(TnButtonHarness.with({ label: 'Extend' }));
    await extendButton.click();

    expect(poolExtendJobService.checkForExistingExtendJob).toHaveBeenCalledWith(4);
    expect(spectator.inject(DialogService).jobDialog).not.toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).error).toHaveBeenCalledWith(
      'A VDEV extension operation is already in progress for this pool. Please wait for it to complete.',
    );
  });

  it('allows operation to proceed when no existing job is found', async () => {
    const poolExtendJobService = spectator.inject(PoolExtendJobService);
    jest.spyOn(poolExtendJobService, 'checkForExistingExtendJob').mockReturnValue(of(false));

    const disk = await loader.getHarness(TnAutocompleteHarness);
    await disk.selectOption('sde (10.91 TiB)');

    const extendButton = await loader.getHarness(TnButtonHarness.with({ label: 'Extend' }));
    await extendButton.click();

    expect(poolExtendJobService.checkForExistingExtendJob).toHaveBeenCalledWith(4);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('unlocks a locked SED disk with an individual password before extending', async () => {
    const api = spectator.inject(TypedApiService) as unknown as MockTypedApiService;
    api.mockQuery('disk.query', [{ name: 'sde', sed: true, sed_status: SedStatus.Locked } as WebUiQueryEntity<'disk.query'>]);
    api.mockCall('disk.unlock_sed', true);
    spectator.fixture.autoDetectChanges();

    const disk = await loader.getHarness(TnAutocompleteHarness);
    await disk.selectOption('sde (10.91 TiB)');
    await spectator.fixture.whenStable();

    const source = await loader.getHarness(TnRadioGroupHarness);
    await source.select('Individual password for this disk');
    const password = await loader.getHarness(TnInputHarness);
    await password.setValue('disk-secret');

    const extendButton = await loader.getHarness(TnButtonHarness.with({ label: 'Extend' }));
    await extendButton.click();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenCalledWith('disk.unlock_sed', [{ name: 'sde', password: 'disk-secret' }]);
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.attach', [4, expect.objectContaining({ new_disk: 'sde' })]);
  });
});
