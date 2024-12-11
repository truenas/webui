import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { UploadIsoDialogComponent } from 'app/pages/vm/vm-wizard/upload-iso-dialog/upload-iso-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { InstallationMediaStepComponent } from './installation-media-step.component';

describe('InstallationMediaStepComponent', () => {
  let spectator: Spectator<InstallationMediaStepComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: InstallationMediaStepComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of('/mnt/iso/new-windows.iso')),
        })),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows form with form field to select ISO path', async () => {
    await form.fillForm({
      'Optional: Choose installation media image': '/mnt/iso/windows.iso',
    });

    expect(spectator.component.form.value).toEqual({
      iso_path: '/mnt/iso/windows.iso',
    });
  });

  it('returns summary when getSummary() is called', async () => {
    await form.fillForm({
      'Optional: Choose installation media image': '/mnt/iso/windows.iso',
    });

    expect(spectator.component.getSummary()).toEqual([
      {
        label: 'Installation Media',
        value: '/mnt/iso/windows.iso',
      },
    ]);
  });

  it('shows button to upload new ISO', async () => {
    const uploadButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upload New Image File' }));
    await uploadButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(UploadIsoDialogComponent);

    expect(spectator.component.form.value).toEqual({
      iso_path: '/mnt/iso/new-windows.iso',
    });
  });
});
