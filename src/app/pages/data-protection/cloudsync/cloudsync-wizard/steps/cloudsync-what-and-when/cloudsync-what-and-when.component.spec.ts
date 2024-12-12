import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { googlePhotosCreds, googlePhotosProvider } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.testing.utils';
import { CloudSyncWhatAndWhenComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-what-and-when/cloudsync-what-and-when.component';
import { TransferModeExplanationComponent } from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { DatasetService } from 'app/services/dataset-service/dataset.service';
import { SlideInService } from 'app/services/slide-in.service';

describe('CloudSyncWhatAndWhenComponent', () => {
  let spectator: Spectator<CloudSyncWhatAndWhenComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const chainedRef: ChainedRef<unknown> = {
    close: jest.fn(),
    swap: jest.fn(),
    getData: jest.fn(),
    requireConfirmationWhen: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: CloudSyncWhatAndWhenComponent,
    imports: [
      ReactiveFormsModule,
      TransferModeExplanationComponent,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(ChainedRef, chainedRef),
      mockAuth(),
      mockApi([
        mockCall('cloudsync.create'),
        mockCall('cloudsync.update'),
        mockCall('cloudsync.credentials.query', [googlePhotosCreds]),
        mockCall('cloudsync.providers', [googlePhotosProvider]),
      ]),
      mockProvider(SlideInService),
      mockProvider(DatasetService),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(SlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      'Directory/Files': '/mnt/gphotos',
      Description: 'Sync Google Photos',
    });
  });

  it('returns fields when getPayload() is called', () => {
    expect(spectator.component.getPayload()).toEqual({
      attributes: {
        folder: '/',
      },
      bwlimit: [],
      create_empty_src_dirs: false,
      credentials: null,
      description: 'Sync Google Photos',
      direction: 'PULL',
      enabled: true,
      encryption: false,
      exclude: [],
      follow_symlinks: false,
      include: undefined,
      path: '/mnt/gphotos',
      post_script: '',
      pre_script: '',
      schedule: {
        dom: '*',
        dow: '*',
        hour: '0',
        minute: '0',
        month: '*',
      },
      snapshot: false,
      transfer_mode: 'COPY',
      transfers: 4,
    });
  });

  it('when an required field is empty, the "Save" button is disabled', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

    await form.fillForm({ Description: '' });
    expect(await saveButton.isDisabled()).toBe(true);

    await form.fillForm({ Description: 'Sync Google Photos' });
    expect(await saveButton.isDisabled()).toBe(false);
  });

  it('emits (save) when Save is selected', async () => {
    jest.spyOn(spectator.component.save, 'emit');
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    expect(spectator.component.save.emit).toHaveBeenCalled();
  });

  it('opens an advanced form when Advanced Options is pressed', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedButton.click();
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      buttonText: 'Continue',
      cancelText: 'Cancel',
      message:
        'Switching to Advanced Options will lose data entered on second step. Do you want to continue?',
      title: 'Switch to Advanced Options',
      hideCheckbox: true,
    });
    expect(chainedRef.swap).toHaveBeenCalledWith(CloudSyncFormComponent, true);
  });

  it('checks payload when use invalid s3 credentials', async () => {
    const bucketSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Bucket' }));
    expect(await bucketSelect.getValue()).toBe('');

    spectator.component.isCredentialInvalid$.next(true);
    spectator.detectChanges();

    const bucketInput = await loader.getHarness(IxInputHarness.with({ label: 'Bucket' }));
    await bucketInput.setValue('selected');

    expect(spectator.component.getPayload()).toEqual(expect.objectContaining({
      attributes: expect.objectContaining({
        bucket: 'selected',
      }),
    }));

    await bucketInput.setValue('test-bucket');
    expect(spectator.component.getPayload()).toEqual(expect.objectContaining({
      attributes: expect.objectContaining({
        bucket: 'test-bucket',
      }),
    }));
  });
});
