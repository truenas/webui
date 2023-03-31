import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { UploadIsoDialogComponent } from 'app/pages/vm/vm-wizard/upload-iso-dialog/upload-iso-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxFileUploadService } from 'app/services/ix-file-upload.service';

describe('UploadIsoDialogComponent', () => {
  let spectator: Spectator<UploadIsoDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const fileUploaded$ = new Subject<void>();
  const createComponent = createComponentFactory({
    component: UploadIsoDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxFileUploadService, {
        onUploaded$: fileUploaded$,
        onUploading$: of(),
        upload: jest.fn(() => {
          fileUploaded$.next();
        }),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => of()),
      }),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('uploads new image to the path provided and closes dialog with uploaded path', async () => {
    const upload = fakeFile('new-windows.iso');

    await form.fillForm({
      'ISO save location': '/mnt/iso',
      'Installer image file': [upload],
    });

    const uploadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upload' }));
    await uploadButton.click();

    expect(spectator.inject(IxFileUploadService).upload).toHaveBeenCalledWith(upload, 'filesystem.put', [
      '/mnt/iso/new-windows.iso', { mode: 493 },
    ]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('/mnt/iso/new-windows.iso');
  });
});
