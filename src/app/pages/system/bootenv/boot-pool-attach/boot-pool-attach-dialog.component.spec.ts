import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  UnusedDiskSelectComponent,
} from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { BootPoolAttachDialogComponent } from './boot-pool-attach-dialog.component';

describe('BootPoolAttachDialogComponent', () => {
  let spectator: Spectator<BootPoolAttachDialogComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: BootPoolAttachDialogComponent,
    imports: [
      ReactiveFormsModule,
      UnusedDiskSelectComponent,
    ],
    providers: [
      mockApi([
        mockCall('disk.details', {
          unused: [
            {
              devname: 'sdb',
              name: 'sdb',
              size: 10737418240,
            },
          ] as DetailsDisk[],
          used: [],
        }),
        mockJob('boot.attach'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => {
          return { afterClosed: jest.fn(() => of(null)) };
        }),
      }),
      mockProvider(MatDialogRef),
      mockAuth(),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('sends an update payload to websocket when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Member Disk': 'sdb (10 GiB)',
      'Use all disk space': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.job).toHaveBeenCalledWith('boot.attach', ['sdb', { expand: true }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Device «sdb» was successfully attached.');
  });
});
