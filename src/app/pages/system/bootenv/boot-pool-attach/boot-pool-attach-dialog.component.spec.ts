import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnAutocompleteHarness, TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  UnusedDiskSelectComponent,
} from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { BootPoolAttachDialog } from './boot-pool-attach-dialog.component';

describe('BootPoolAttachDialogComponent', () => {
  let spectator: Spectator<BootPoolAttachDialog>;
  let loader: HarnessLoader;
  let api: TypedApiService;

  const createComponent = createComponentFactory({
    component: BootPoolAttachDialog,
    imports: [
      ReactiveFormsModule,
      UnusedDiskSelectComponent,
    ],
    providers: [
      mockTypedApi([
        mockTypedCall('disk.details', {
          unused: [
            {
              devname: 'sdb',
              name: 'sdb',
              size: 10737418240,
            },
          ] as DetailsDisk[],
          used: [],
        }),
        mockTypedJob('boot.attach', { state: JobState.Success }),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => {
          return { afterClosed: jest.fn(() => of(null)) };
        }),
      }),
      mockProvider(DialogRef),
      mockAuth(),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(TypedApiService);
  });

  it('sends an update payload to websocket when save is pressed', async () => {
    const disk = await loader.getHarness(TnAutocompleteHarness);
    await disk.selectOption('sdb (10 GiB)');

    const expand = await loader.getHarness(TnCheckboxHarness.with({ label: 'Use all disk space' }));
    await expand.check();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('boot.attach', ['sdb', { expand: true }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Device «sdb» was successfully attached.');
  });
});
