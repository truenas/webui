import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFileInputHarness } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.harness';
import { AuthService } from 'app/services/auth/auth.service';
import { UploadService } from 'app/services/upload.service';
import { UploadConfigDialogComponent } from './upload-config-dialog.component';

describe('UploadConfigDialogComponent', () => {
  let spectator: Spectator<UploadConfigDialogComponent>;
  const createComponent = createComponentFactory({
    component: UploadConfigDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(Router),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(UploadService, {
        uploadAsJob: jest.fn(() => of(fakeSuccessfulJob())),
      }),
      mockProvider(AuthService, {
        authToken$: of('token'),
        hasRole: () => of(true),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('uploads config when dialog is submitted', async () => {
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const file = fakeFile('config.db');

    const fileInput = await loader.getHarness(IxFileInputHarness.with({ label: 'Select Configuration File' }));
    await fileInput.setValue([file]);

    const uploadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upload' }));
    await uploadButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(UploadService).uploadAsJob).toHaveBeenCalledWith({ file, method: 'config.upload' });
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/restart'], { skipLocationChange: true });
  });
});
