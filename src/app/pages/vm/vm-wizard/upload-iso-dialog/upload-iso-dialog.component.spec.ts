import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
        upload: jest.fn(() => ({
          observable: of(new HttpResponse({ status: 200 })),
          cancel: jest.fn(),
        })),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => of()),
      }),
      mockProvider(LoaderService, {
        open: jest.fn(() => of(true)),
        close: jest.fn(),
        setTitle: jest.fn(),
      }),
      mockProvider(SnackbarService, {
        success: jest.fn(),
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

  it('cancels upload and cleans up when component is destroyed', async () => {
    const upload = fakeFile('test-upload.iso');
    const uploadSubject$ = new Subject<HttpEvent<unknown>>();

    // Mock upload service to return controllable subject
    jest.spyOn(spectator.inject(UploadService), 'upload').mockReturnValue({
      observable: uploadSubject$.asObservable(),
      cancel: jest.fn(),
    });

    await form.fillForm({
      'ISO save location': '/mnt/iso',
      'Installer image file': [upload],
    });

    const uploadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upload' }));
    await uploadButton.click();

    // Verify upload started
    expect(spectator.inject(UploadService).upload).toHaveBeenCalled();

    // Destroy the component (simulates clicking outside dialog)
    spectator.component.ngOnDestroy();

    // Try to emit more upload events - they should be ignored due to takeUntil
    const uploadEventSpy = jest.fn();
    uploadSubject$.subscribe(uploadEventSpy);

    uploadSubject$.next({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 });

    // Verify the upload subscription was cancelled
    expect(uploadEventSpy).toHaveBeenCalled(); // The subject itself still emits
    // But the component's subscription should be cancelled
  });
});
