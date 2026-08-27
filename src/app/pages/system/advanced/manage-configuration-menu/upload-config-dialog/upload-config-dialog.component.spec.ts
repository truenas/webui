import { DialogRef } from '@angular/cdk/dialog';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnFileInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UploadConfigDialog } from 'app/pages/system/advanced/manage-configuration-menu/upload-config-dialog/upload-config-dialog.component';
import { UploadService } from 'app/services/upload.service';

describe('UploadConfigDialogComponent', () => {
  let spectator: Spectator<UploadConfigDialog>;
  const createComponent = createComponentFactory({
    component: UploadConfigDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DialogRef),
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

  // `TnFileInputHarness` exposes no setter — a browser will not let a test populate a native file
  // input — so drive the control the way the component does, through the native change event.
  const selectFile = (file: File): void => {
    const nativeInput = spectator.query('input[type="file"]');
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { files: [file] }, writable: true });
    nativeInput.dispatchEvent(event);
    spectator.detectChanges();
  };

  it('uploads config when dialog is submitted', async () => {
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const file = fakeFile('config.db');

    expect(await loader.getHarness(TnFileInputHarness)).toBeTruthy();
    selectFile(file);

    const uploadButton = await loader.getHarness(TnButtonHarness.with({ label: 'Upload' }));
    await uploadButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(UploadService).uploadAsJob).toHaveBeenCalledWith({ file, method: 'config.upload' });
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system-tasks/restart'], { skipLocationChange: true });
  });
});
