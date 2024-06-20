import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { UnusedDiskSelectComponent } from 'app/modules/custom-selects/unused-disk-select/unused-disk-select.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { WebSocketService } from 'app/services/ws.service';
import { BootPoolAttachDialogComponent } from './boot-pool-attach-dialog.component';

describe('BootPoolAttachDialogComponent', () => {
  let spectator: Spectator<BootPoolAttachDialogComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: BootPoolAttachDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      UnusedDiskSelectComponent,
    ],
    providers: [
      mockWebSocket([
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
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('sends an update payload to websocket when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Member Disk': 'sdb (10 GiB)',
      'Use all disk space': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.job).toHaveBeenCalledWith('boot.attach', ['sdb', { expand: true }]);
  });
});
