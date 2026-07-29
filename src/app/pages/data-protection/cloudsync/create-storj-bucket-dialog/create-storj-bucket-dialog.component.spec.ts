import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CreateStorjBucketDialog,
} from 'app/pages/data-protection/cloudsync/create-storj-bucket-dialog/create-storj-bucket-dialog.component';

describe('CreateStorjBucketDialogComponent', () => {
  let spectator: Spectator<CreateStorjBucketDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CreateStorjBucketDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('cloudsync.create_bucket'),
      ]),
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
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
    const bucketName = await loader.getHarness(TnInputHarness);
    await bucketName.setValue('new-bucket');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('cloudsync.create_bucket', [1, 'new-bucket']);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith('new-bucket');
  });
});
