import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { UploadIsoDialogComponent } from 'app/pages/vm/vm-wizard/upload-iso-dialog/upload-iso-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { UploadService } from 'app/services/upload.service';

describe('UploadIsoDialogComponent', () => {
  let spectator: Spectator<UploadIsoDialogComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: UploadIsoDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(UploadService, {
        upload: jest.fn(() => of(new HttpResponse({ status: 200 }))),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => of()),
      }),
      mockProvider(MatDialogRef),
      mockAuth(),
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

    expect(spectator.inject(UploadService).upload).toHaveBeenCalledWith(expect.objectContaining({
      file: upload,
      method: 'filesystem.put',
      params: ['/mnt/iso/new-windows.iso', { mode: 493 }],
    }));
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith('/mnt/iso/new-windows.iso');
  });
});
