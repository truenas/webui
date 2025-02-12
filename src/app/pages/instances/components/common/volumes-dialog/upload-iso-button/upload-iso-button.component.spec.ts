import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFileInputHarness } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  UploadIsoButtonComponent,
} from 'app/pages/instances/components/common/volumes-dialog/upload-iso-button/upload-iso-button.component';
import { UploadService } from 'app/services/upload.service';

describe('UploadIsoButtonComponent', () => {
  let spectator: Spectator<UploadIsoButtonComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: UploadIsoButtonComponent,
    providers: [
      mockProvider(UploadService, {
        uploadAsJob: jest.fn(() => of({} as Job)),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('virt.volume.query', []),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('uploads ISO when it is selected and emits (uploaded)', async () => {
    const iso = fakeFile('test.iso');

    jest.spyOn(spectator.component.uploaded, 'emit');

    const fileInput = await loader.getHarness(IxFileInputHarness);
    await fileInput.setValue([iso]);

    expect(spectator.inject(UploadService).uploadAsJob).toHaveBeenCalledWith({
      file: iso,
      method: 'virt.volume.import_iso',
      params: [{ name: 'test.iso', upload_iso: true }],
    });
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Image uploaded successfully');

    expect(spectator.component.uploaded.emit).toHaveBeenCalled();
  });
});
