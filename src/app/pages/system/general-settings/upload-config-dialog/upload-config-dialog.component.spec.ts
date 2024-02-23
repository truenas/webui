import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFileInputHarness } from 'app/modules/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AuthService } from 'app/services/auth/auth.service';
import { UploadConfigDialogComponent } from './upload-config-dialog.component';

describe('UploadConfigDialogComponent', () => {
  let spectator: Spectator<UploadConfigDialogComponent>;
  const createComponent = createComponentFactory({
    component: UploadConfigDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(MatDialogRef),
      mockProvider(Router),
      mockProvider(DialogService),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockEntityJobComponentRef),
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

    expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
    const formData = new FormData();
    formData.append('data', JSON.stringify({
      method: 'config.upload',
      params: [],
    }));
    formData.append('file', file);
    expect(mockEntityJobComponentRef.componentInstance.wspost).toHaveBeenCalledWith('/_upload?auth_token=token', formData);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/others/reboot'], { skipLocationChange: true });
  });
});
