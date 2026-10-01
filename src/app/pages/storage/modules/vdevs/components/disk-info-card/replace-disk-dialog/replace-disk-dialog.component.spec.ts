import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnAutocompleteHarness, TnButtonHarness, TnCheckboxHarness, TnDialogHarness, TnInputHarness, TnRadioGroupHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
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
  ReplaceDiskDialogData,
  ReplaceDiskDialog,
} from 'app/pages/storage/modules/vdevs/components/disk-info-card/replace-disk-dialog/replace-disk-dialog.component';
import {
  mockSedDiskPasswordCalls, sedEntitledProvider,
} from 'app/pages/storage/modules/vdevs/components/sed-disk-password/testing/sed-disk-password-mocks';

describe('ReplaceDiskDialogComponent', () => {
  let spectator: Spectator<ReplaceDiskDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ReplaceDiskDialog,
    imports: [
      ReactiveFormsModule,
      UnusedDiskSelectComponent,
    ],
    providers: [
      mockTypedApi([
        mockTypedCall('disk.details', {
          unused: [
            { devname: 'sdb', identifier: '{serial_lunid}BBBBB1', size: 10 * GiB },
          ] as DetailsDisk[],
          used: [],
        }),
        ...mockSedDiskPasswordCalls(),
      ]),
      mockApi([
        mockJob('pool.replace', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogRef),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockProvider(SnackbarService),
      {
        provide: DIALOG_DATA,
        useValue: {
          poolId: 1,
          guid: '9804554747743380831',
          diskName: 'sda',
        } as ReplaceDiskDialogData,
      },
      mockAuth(),
      sedEntitledProvider,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a name of the disk that is about to be replaced', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);

    expect(await dialog.getTitle()).toBe('Replacing disk sda');
  });

  it('replaces a disk when the form is submitted', async () => {
    const disk = await loader.getHarness(TnAutocompleteHarness);
    await disk.selectOption('sdb (10 GiB)');

    const force = await loader.getHarness(TnCheckboxHarness.with({ label: 'Force' }));
    await force.check();

    const replaceButton = await loader.getHarness(TnButtonHarness.with({ label: 'Replace Disk' }));
    await replaceButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.replace', [
      1,
      {
        disk: '{serial_lunid}BBBBB1',
        force: true,
        label: '9804554747743380831',
        preserve_description: true,
        preserve_settings: true,
      },
    ]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('shows additional settings to preserve disk settings and description', async () => {
    const preserveSettings = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Preserve Power Management settings' }),
    );
    await preserveSettings.uncheck();

    const preserveDescription = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Preserve disk description' }),
    );
    await preserveDescription.uncheck();

    const disk = await loader.getHarness(TnAutocompleteHarness);
    await disk.selectOption('sdb (10 GiB)');

    const replaceButton = await loader.getHarness(TnButtonHarness.with({ label: 'Replace Disk' }));
    await replaceButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.replace', [
      1,
      {
        disk: '{serial_lunid}BBBBB1',
        force: false,
        label: '9804554747743380831',
        preserve_description: false,
        preserve_settings: false,
      },
    ]);
  });

  it('unlocks a locked SED disk with an individual password before replacing', async () => {
    const api = spectator.inject(TypedApiService) as unknown as MockTypedApiService;
    api.mockQuery('disk.query', [
      { name: 'sdb', sed: true, sed_status: SedStatus.Locked } as WebUiQueryEntity<'disk.query'>,
    ]);
    api.mockCall('disk.unlock_sed', true);
    spectator.fixture.autoDetectChanges();
    await spectator.fixture.whenStable();

    const disk = await loader.getHarness(TnAutocompleteHarness);
    await disk.selectOption('sdb (10 GiB)');
    await spectator.fixture.whenStable();

    expect(api.query).toHaveBeenCalledWith(
      'disk.query',
      [['identifier', '=', '{serial_lunid}BBBBB1']],
      { extra: { sed_status: true } },
    );

    const source = await loader.getHarness(TnRadioGroupHarness);
    await source.select('Individual password for this disk');
    const password = await loader.getHarness(TnInputHarness);
    await password.setValue('disk-secret');

    const replaceButton = await loader.getHarness(TnButtonHarness.with({ label: 'Replace Disk' }));
    await replaceButton.click();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenCalledWith('disk.unlock_sed', [{ name: 'sdb', password: 'disk-secret' }]);
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'pool.replace',
      [1, expect.objectContaining({ disk: '{serial_lunid}BBBBB1' })],
    );
  });
});
