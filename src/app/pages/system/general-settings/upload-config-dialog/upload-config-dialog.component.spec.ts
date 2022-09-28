import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { IxFileInputHarness } from 'app/modules/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { DialogService } from 'app/services';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';
import { UploadConfigDialogComponent } from './upload-config-dialog.component';

describe('UploadConfigDialogComponent', () => {
  let spectator: Spectator<UploadConfigDialogComponent>;
  const fileUploaded$ = new Subject<void>();
  const createComponent = createComponentFactory({
    component: UploadConfigDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockProvider(IxFileUploadService, {
        onUploaded$: fileUploaded$,
        onUploading$: of(),
        upload: jest.fn(() => {
          fileUploaded$.next();
        }),
      }),
      mockProvider(MatDialogRef),
      mockProvider(Router),
      mockProvider(DialogService),
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

    expect(spectator.inject(IxFileUploadService).upload).toHaveBeenCalledWith(file, 'config.upload');
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/others/reboot']);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });
});
