import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import { DatasetEncryptionSummary } from 'app/interfaces/dataset-encryption-summary.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFileInputHarness } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetUnlockComponent } from 'app/pages/datasets/modules/encryption/components/dataset-unlock/dataset-unlock.component';
import { UploadService } from 'app/services/upload.service';

describe('DatasetUnlockComponent', () => {
  let spectator: Spectator<DatasetUnlockComponent>;
  let loader: HarnessLoader;

  const encryptionSummary = fakeSuccessfulJob([
    { name: 'pool_name_1', key_format: DatasetEncryptionType.Default },
    { name: 'pool_name_2', key_format: DatasetEncryptionType.Passphrase },
  ] as DatasetEncryptionSummary[]);

  const createComponent = createComponentFactory({
    component: DatasetUnlockComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(Router),
      mockProvider(ActivatedRoute, {
        snapshot: { params: { datasetId: 'pool_name_1' } },
      }),
      mockApi([
        mockJob('pool.dataset.encryption_summary'),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(encryptionSummary),
        })),
      }),
      mockProvider(MatDialog, {
        open: () => ({
          componentInstance: {},
        }),
      }),
      mockProvider(MatDialogRef),
      mockProvider(UploadService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('saves when set key from file', async () => {
    const file = fakeFile('key.txt');

    const fileInput = await loader.getHarness(IxFileInputHarness.with({ label: 'Upload Key file' }));
    await fileInput.setValue([file]);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(UploadService).uploadAsJob).toHaveBeenCalledWith({
      file,
      method: 'pool.dataset.encryption_summary',
      params: ['pool_name_1', { datasets: undefined, force: false, key_file: true }],
    });
  });

  it('saves when set key manually', async () => {
    const form = await loader.getHarness(IxFormHarness);

    await form.fillForm(
      {
        'Unlock with Key file': 'Provide keys/passphrases manually',
        Force: true,
        'Dataset Key': '0123456789012345678901234567890123456789012345678901234567890123',
        'Dataset Passphrase': '12345678',
      },
    );

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'pool.dataset.encryption_summary',
      [
        'pool_name_1',
        {
          datasets: [
            { key: '0123456789012345678901234567890123456789012345678901234567890123', name: 'pool_name_1' },
            { name: 'pool_name_2', passphrase: '12345678' },
          ],
          force: true,
          key_file: false,
        },
      ],
    );
  });
});
