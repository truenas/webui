import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  CreateStorjBucketDialogComponent,
} from 'app/pages/data-protection/cloudsync/create-storj-bucket-dialog/create-storj-bucket-dialog.component';
import { WebSocketService } from 'app/services/ws.service';

describe('CreateStorjBucketDialogComponent', () => {
  let spectator: Spectator<CreateStorjBucketDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CreateStorjBucketDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('cloudsync.create_bucket'),
      ]),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          credentialsId: 1,
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('creates a cloudsync bucket with bucket name specified by the user', async () => {
    const bucketName = await loader.getHarness(IxInputHarness.with({ label: 'Bucket Name' }));
    await bucketName.setValue('new-bucket');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloudsync.create_bucket', [1, 'new-bucket']);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('new-bucket');
  });
});
