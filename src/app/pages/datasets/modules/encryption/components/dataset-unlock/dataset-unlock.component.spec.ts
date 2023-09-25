import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetEncryptionType } from 'app/enums/dataset.enum';
import { DatasetEncryptionSummary } from 'app/interfaces/dataset-encryption-summary.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxFileInputHarness } from 'app/modules/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DatasetUnlockComponent } from 'app/pages/datasets/modules/encryption/components/dataset-unlock/dataset-unlock.component';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';

describe('DatasetUnlockComponent', () => {
  let spectator: Spectator<DatasetUnlockComponent>;
  let loader: HarnessLoader;

  const fileUploaded$ = new Subject<void>();
  const mockDialogRef = {
    componentInstance: {
      setDescription: jest.fn(),
      setCall: jest.fn(),
      submit: jest.fn(),
      success: of(fakeSuccessfulJob([
        { name: 'pool_name_1', key_format: DatasetEncryptionType.Default },
        { name: 'pool_name_2', key_format: DatasetEncryptionType.Passphrase },
      ] as DatasetEncryptionSummary[])),
      failure: of(),
      wspost: jest.fn(),
    },
    close: jest.fn(),
  } as unknown as MatDialogRef<EntityJobComponent>;

  const createComponent = createComponentFactory({
    component: DatasetUnlockComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DialogService),
      mockProvider(Router),
      mockProvider(ActivatedRoute, {
        snapshot: { params: { datasetId: 'pool_name_1' } },
      }),
      mockWebsocket([
        mockJob('pool.dataset.encryption_summary'),
      ]),
      mockProvider(DialogService),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
      mockProvider(IxFileUploadService, {
        onUploaded$: fileUploaded$,
        onUploading$: of(),
        upload: jest.fn(() => {
          fileUploaded$.next();
        }),
      }),
      mockProvider(MatDialogRef),
      mockProvider(AuthService, {
        authToken$: of('token'),
      }),
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

    expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      method: 'pool.dataset.encryption_summary',
      params: ['pool_name_1', {
        key_file: true,
        force: false,
      }],
    }));
    formData.append('file', spectator.component.form.value.key);
    expect(mockDialogRef.componentInstance.wspost).toHaveBeenCalledWith('/_upload?auth_token=token', formData);
  });

  it('saves when set key manually', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Unlock with Key file': 'Provide keys/passphrases manually',
      Force: true,
    });

    await form.fillForm({
      'Dataset Key': '0123456789012345678901234567890123456789012345678901234567890123',
      'Dataset Passphrase': '12345678',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(mockDialogRef.componentInstance.setCall).toHaveBeenCalledWith('pool.dataset.encryption_summary', [
      'pool_name_1',
      {
        force: true,
        key_file: false,
        datasets: [
          { name: 'pool_name_1', key: '0123456789012345678901234567890123456789012345678901234567890123' },
          { name: 'pool_name_2', passphrase: '12345678' },
        ],
      },
    ]);
  });
});
