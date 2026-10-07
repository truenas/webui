import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
      mockTypedApi([
        mockTypedCall('cloudsync.create_bucket', null),
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

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('cloudsync.create_bucket', [1, 'new-bucket']);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith('new-bucket');
  });
});
