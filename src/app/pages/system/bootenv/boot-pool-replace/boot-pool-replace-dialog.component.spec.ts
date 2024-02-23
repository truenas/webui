import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { BootPoolReplaceDialogComponent } from './boot-pool-replace-dialog.component';

describe('BootPoolReplaceDialogComponent', () => {
  let spectator: Spectator<BootPoolReplaceDialogComponent>;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: BootPoolReplaceDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('disk.get_unused', [
          {
            name: 'sdb',
            size: 10737418240,
          },
        ] as UnusedDisk[]),
        mockJob('boot.replace', fakeSuccessfulJob()),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
      }),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: 'sda3',
      },
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('sends an update payload to websocket when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Member Disk': 'sdb - 10 GiB',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(EntityJobComponent, expect.anything());
    expect(mockEntityJobComponentRef.componentInstance.setCall)
      .toHaveBeenCalledWith('boot.replace', ['sda3', 'sdb']);
    expect(mockEntityJobComponentRef.componentInstance.submit).toHaveBeenCalled();
  });
});
