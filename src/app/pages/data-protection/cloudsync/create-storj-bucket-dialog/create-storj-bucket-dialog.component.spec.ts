import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CreateStorjBucketDialogComponent,
} from 'app/pages/data-protection/cloudsync/create-storj-bucket-dialog/create-storj-bucket-dialog.component';

describe('CreateStorjBucketDialogComponent', () => {
  let spectator: Spectator<CreateStorjBucketDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CreateStorjBucketDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
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

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.create_bucket', [1, 'new-bucket']);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('new-bucket');
  });
});
